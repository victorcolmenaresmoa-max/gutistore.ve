import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
  createAdminSessionToken,
  isValidAdminSessionToken,
  passwordMatches,
} from '@/lib/admin-auth';
import { isRateLimited, rateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { clientIp, forbiddenOrigin, isSameOrigin, tooManyRequests } from '@/lib/security/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 5 intentos fallidos por IP cada 15 minutos. */
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const NO_STORE = { 'Cache-Control': 'no-store' };

function cookieOptions(maxAge: number) {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true, // JavaScript del navegador no puede leerla.
    secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS.
    sameSite: 'strict' as const, // No se envía desde otras webs (anti-CSRF).
    path: '/',
    maxAge,
  };
}

export async function GET(request: NextRequest) {
  const valid = isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ ok: true, data: { authenticated: valid } }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const key = `login:${clientIp(request)}`;
  const blocked = isRateLimited(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!blocked.ok) {
    return tooManyRequests(
      blocked.retryAfter,
      `Demasiados intentos fallidos. Espera ${Math.ceil(blocked.retryAfter / 60)} minuto(s) e inténtalo de nuevo.`
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { password?: unknown; website?: unknown };

    // Campo trampa invisible: solo un bot lo rellena.
    if (body.website) {
      rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
      return NextResponse.json({ ok: false, message: 'La contraseña ingresada no es correcta.' }, { status: 401 });
    }

    const password = typeof body.password === 'string' ? body.password : '';
    if (!passwordMatches(password)) {
      rateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
      // Pequeña pausa: hace más lento probar contraseñas a lo bruto.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return NextResponse.json({ ok: false, message: 'La contraseña ingresada no es correcta.' }, { status: 401 });
    }

    resetRateLimit(key);
    const response = NextResponse.json({ ok: true, data: { authenticated: true } }, { headers: NO_STORE });
    response.cookies.set({ ...cookieOptions(ADMIN_SESSION_SECONDS), value: createAdminSessionToken() });
    return response;
  } catch (error) {
    // Solo se muestran mensajes de configuración propios, nunca detalles internos.
    const message =
      error instanceof Error && error.message.startsWith('Falta configurar')
        ? error.message
        : 'No se pudo iniciar sesión.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const response = NextResponse.json({ ok: true, data: { authenticated: false } }, { headers: NO_STORE });
  response.cookies.set({ ...cookieOptions(0), value: '' });
  return response;
}
