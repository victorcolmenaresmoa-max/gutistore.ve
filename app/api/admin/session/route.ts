import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isValidAdminSessionToken,
  passwordMatches,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const valid = isValidAdminSessionToken(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value
  );
  return NextResponse.json({ ok: true, data: { authenticated: valid } });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!passwordMatches(body.password || '')) {
      return NextResponse.json(
        { ok: false, message: 'La contraseña ingresada no es correcta.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      data: { authenticated: true },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    data: { authenticated: false },
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
