import { randomUUID } from 'crypto';
import { getSupabaseProjectUrl, supabaseAuthHeaders } from '@/lib/supabase-rest';

/** Bucket público de Supabase Storage donde se guardan las fotos de la tienda. */
export const IMAGE_BUCKET = 'gutistore-fotos';

/** Carpetas permitidas dentro del bucket (una por tipo de foto). */
export const IMAGE_FOLDERS = ['productos', 'variantes', 'promociones', 'categorias'] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export function isImageFolder(value: unknown): value is ImageFolder {
  return typeof value === 'string' && (IMAGE_FOLDERS as readonly string[]).includes(value);
}

let bucketReady = false;

/**
 * Crea el bucket la primera vez (si no existe). Así no hace falta entrar a
 * Supabase a crearlo a mano.
 */
async function ensureBucket(baseUrl: string) {
  if (bucketReady) return;
  const headers = { ...supabaseAuthHeaders(), 'Content-Type': 'application/json' };
  const existing = await fetch(`${baseUrl}/storage/v1/bucket/${IMAGE_BUCKET}`, { headers, cache: 'no-store' });
  if (!existing.ok) {
    const created = await fetch(`${baseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: IMAGE_BUCKET,
        name: IMAGE_BUCKET,
        public: true, // Cualquiera puede VER las fotos (las necesita la tienda)…
        file_size_limit: 5 * 1024 * 1024, // …pero solo el servidor puede subirlas.
        allowed_mime_types: ['image/webp'],
      }),
    });
    // 409 = otro proceso lo creó al mismo tiempo: está bien.
    if (!created.ok && created.status !== 409) {
      const detail = await created.text().catch(() => '');
      if (!/already exists|duplicate/i.test(detail)) {
        throw new Error('No se pudo preparar el almacenamiento de fotos en Supabase.');
      }
    }
  }
  bucketReady = true;
}

/** Sube una imagen WebP ya procesada y devuelve su URL pública. */
export async function uploadImage(folder: ImageFolder, data: Buffer): Promise<string> {
  const baseUrl = getSupabaseProjectUrl();
  await ensureBucket(baseUrl);

  const now = new Date();
  const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.webp`;

  const response = await fetch(`${baseUrl}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      ...supabaseAuthHeaders(),
      'Content-Type': 'image/webp',
      'Cache-Control': 'max-age=31536000',
      'x-upsert': 'false',
    },
    body: new Uint8Array(data),
  });

  if (!response.ok) {
    console.error('Error subiendo imagen a Supabase Storage:', response.status, await response.text().catch(() => ''));
    throw new Error('No se pudo guardar la foto en Supabase.');
  }

  return `${baseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
