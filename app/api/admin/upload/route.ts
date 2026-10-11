import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { clientIp, forbiddenOrigin, isSameOrigin, tooManyRequests } from '@/lib/security/request';
import { isImageFolder, uploadImage } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vercel acepta cuerpos de hasta ~4.5 MB; el navegador ya comprime antes de enviar. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Formatos de imagen aceptados (se comprueba el contenido real, no la extensión). */
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'gif', 'heif', 'tiff']);
/** Lado máximo de la foto final, en píxeles. */
const MAX_SIDE = 1600;

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  if (!isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return fail('Tu sesión del panel expiró. Vuelve a iniciar sesión.', 401);
  }

  const limit = rateLimit(`upload:${clientIp(request)}`, 80, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter, 'Has subido muchas fotos seguidas. Espera un momento.');

  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_UPLOAD_BYTES + 64 * 1024) {
    return fail('La foto es demasiado pesada (máximo 4 MB).', 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('No se recibió ninguna foto.');
  }

  const file = form.get('file');
  const folder = form.get('folder');
  if (!(file instanceof Blob) || file.size === 0) return fail('No se recibió ninguna foto.');
  if (file.size > MAX_UPLOAD_BYTES) return fail('La foto es demasiado pesada (máximo 4 MB).', 413);
  if (!isImageFolder(folder)) return fail('Destino de la foto no válido.');

  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  try {
    // Se lee el contenido real del archivo: si no es una imagen, se rechaza
    // aunque tenga extensión .jpg.
    const meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
      return fail('Formato no permitido. Usa JPG, PNG, WEBP o AVIF.');
    }

    // Se vuelve a generar la imagen desde cero: así se eliminan datos ocultos
    // (ubicación GPS, modelo del teléfono…) y cualquier contenido malicioso.
    output = await sharp(input, { limitInputPixels: 50_000_000, animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return fail('No se pudo leer la foto. Prueba con otra imagen (JPG, PNG o WEBP).');
  }

  try {
    const url = await uploadImage(folder, output);
    return NextResponse.json({ ok: true, data: { url } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(error);
    return fail('No se pudo guardar la foto. Inténtalo de nuevo.', 502);
  }
}
