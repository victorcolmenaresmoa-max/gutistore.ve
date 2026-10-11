/**
 * Subida de fotos desde el panel. Antes de enviar, la foto se reduce en el
 * propio navegador (máx. 1600 px) para que suba rápido incluso con datos
 * móviles; el servidor la vuelve a procesar y la guarda en Supabase.
 */

export type UploadFolder = 'productos' | 'variantes' | 'promociones' | 'categorias';

const MAX_SIDE = 1600;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const MAX_SEND_BYTES = 4 * 1024 * 1024;

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif';

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    // Algunos Safari no generan WebP: en ese caso se usa JPG.
    const webp = await canvasToBlob(canvas, 'image/webp', 0.88);
    if (webp && webp.type === 'image/webp') return webp;
    return (await canvasToBlob(canvas, 'image/jpeg', 0.88)) || file;
  } catch {
    // Formato que el navegador no sabe abrir (p. ej. HEIC en Chrome): se envía tal cual.
    return file;
  }
}

export async function uploadImageFile(file: File, folder: UploadFolder): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error('Ese archivo no es una foto. Elige una imagen JPG, PNG o WEBP.');
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error('La foto es demasiado pesada (máximo 25 MB).');
  }

  const blob = await shrink(file);
  if (blob.size > MAX_SEND_BYTES) {
    throw new Error('No se pudo reducir la foto lo suficiente. Prueba con una imagen JPG o PNG.');
  }

  const form = new FormData();
  form.append('file', blob, 'foto');
  form.append('folder', folder);

  let response: Response;
  try {
    response = await fetch('/api/admin/upload', { method: 'POST', body: form, credentials: 'same-origin' });
  } catch {
    throw new Error('Sin conexión. Revisa tu internet e inténtalo de nuevo.');
  }

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; data?: { url?: string } } | null;
  if (!response.ok || !payload?.ok || !payload.data?.url) {
    throw new Error(payload?.message || 'No se pudo subir la foto.');
  }
  return payload.data.url;
}
