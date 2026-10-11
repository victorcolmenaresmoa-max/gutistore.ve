import { NextRequest, NextResponse } from 'next/server';

/** IP del visitante (Vercel la entrega en x-forwarded-for). */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Protección CSRF: las peticiones que cambian datos deben venir de esta
 * misma web. Los navegadores siempre envían el encabezado Origin en POST.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Sin Origin: se acepta solo si el navegador confirma que es la misma web
    // (o si no es un navegador, que de todos modos no tiene la cookie de sesión).
    const site = request.headers.get('sec-fetch-site');
    return !site || site === 'same-origin' || site === 'none';
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function tooManyRequests(retryAfter: number, message?: string) {
  return NextResponse.json(
    {
      ok: false,
      message: message || 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

export function forbiddenOrigin() {
  return NextResponse.json({ ok: false, message: 'Solicitud no permitida.' }, { status: 403 });
}
