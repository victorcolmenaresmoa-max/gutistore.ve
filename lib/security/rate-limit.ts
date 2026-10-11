/**
 * Límite de peticiones por IP (ventana deslizante en memoria).
 *
 * En Vercel cada instancia del servidor tiene su propia memoria, así que el
 * límite es "por instancia": no es perfecto, pero frena ataques de fuerza
 * bruta y bots que envían muchas peticiones seguidas desde la misma IP.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  // Limpieza ocasional para que el mapa no crezca sin límite.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((bucket, key) => {
    bucket.hits = bucket.hits.filter((time) => now - time < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  });
}

export interface RateLimitResult {
  ok: boolean;
  /** Segundos hasta que se puede volver a intentar. */
  retryAfter: number;
}

/**
 * Registra un intento y dice si todavía está dentro del límite.
 * @param key   identificador (por ejemplo "login:1.2.3.4")
 * @param limit intentos permitidos dentro de la ventana
 * @param windowMs duración de la ventana en milisegundos
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);
  const bucket = buckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const retryAfter = Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1000));
    return { ok: false, retryAfter };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

/** Consulta el límite sin registrar un intento nuevo. */
export function isRateLimited(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key)?.hits || []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Borra los intentos registrados (por ejemplo, tras un login correcto). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
