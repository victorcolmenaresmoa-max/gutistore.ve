import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE_NAME = 'guti-admin-session';

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || '';
}

export function assertAdminConfig() {
  if (!getAdminPassword()) {
    throw new Error('Falta configurar ADMIN_PASSWORD en Vercel.');
  }

  if (!getSessionSecret()) {
    throw new Error('Falta configurar ADMIN_SESSION_SECRET en Vercel.');
  }
}

export function passwordMatches(candidate: string) {
  assertAdminConfig();
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(candidate || '');

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function createAdminSessionToken() {
  assertAdminConfig();
  return createHmac('sha256', getSessionSecret())
    .update(`guti-admin:${getAdminPassword()}`)
    .digest('hex');
}

export function isValidAdminSessionToken(candidate?: string | null) {
  if (!candidate) return false;

  try {
    const expected = Buffer.from(createAdminSessionToken());
    const received = Buffer.from(candidate);
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
