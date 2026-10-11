import { createHash, createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_COOKIE_NAME = 'guti-admin-session';

/** La sesión del panel dura 12 horas; después hay que volver a entrar. */
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

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

/** Huella SHA-256: permite comparar sin revelar la longitud de la contraseña. */
function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Compara la contraseña escrita con la configurada en Vercel.
 * Se comparan las huellas (hash) en tiempo constante para no filtrar
 * pistas por el tiempo de respuesta.
 */
export function passwordMatches(candidate: string) {
  assertAdminConfig();
  if (!candidate || candidate.length > 256) return false;
  return safeEqual(sha256(getAdminPassword()), sha256(candidate));
}

function sign(expiresAt: number) {
  // La firma incluye la huella de la contraseña: si la cambias en Vercel,
  // todas las sesiones abiertas dejan de funcionar al instante.
  const passwordHash = sha256(getAdminPassword()).toString('hex');
  return createHmac('sha256', getSessionSecret())
    .update(`guti-admin:v2:${expiresAt}:${passwordHash}`)
    .digest('hex');
}

/** Crea un token firmado que caduca solo (formato: vencimiento.firma). */
export function createAdminSessionToken() {
  assertAdminConfig();
  const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidAdminSessionToken(candidate?: string | null) {
  if (!candidate || candidate.length > 200) return false;

  try {
    assertAdminConfig();
    const [rawExpires, signature] = candidate.split('.');
    const expiresAt = Number(rawExpires);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) return false;
    return safeEqual(Buffer.from(sign(expiresAt)), Buffer.from(signature));
  } catch {
    return false;
  }
}
