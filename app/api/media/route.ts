import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_FILES = 10;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'guti-store-media';
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
]);

function config() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) throw new Error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY para usar el almacenamiento.');
  return { url, key };
}

function authHeaders(key: string) {
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

function isAdmin(request: NextRequest) {
  return isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

function cleanFolder(value: FormDataEntryValue | null) {
  return String(value || 'products').toLowerCase().replace(/[^a-z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'products';
}

function storagePath(folder: string, extension: string) {
  return `${folder}/${Date.now()}-${randomUUID()}.${extension}`;
}

function encodedObjectPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ ok: false, message: 'Sesión administrativa no válida.' }, { status: 401 });

  try {
    const form = await request.formData();
    const folder = cleanFolder(form.get('folder'));
    const files = form.getAll('files').filter((value): value is File => value instanceof File);
    if (!files.length) return NextResponse.json({ ok: false, message: 'Selecciona al menos una imagen.' }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ ok: false, message: `Puedes subir hasta ${MAX_FILES} imágenes a la vez.` }, { status: 400 });

    const { url, key } = config();
    const urls: string[] = [];

    for (const file of files) {
      const extension = ALLOWED_TYPES.get(file.type);
      if (!extension) throw new Error(`${file.name} debe ser JPG, PNG, WebP o AVIF.`);
      if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} supera el límite de 12 MB.`);

      const objectPath = storagePath(folder, extension);
      const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodedObjectPath(objectPath)}`, {
        method: 'POST',
        headers: {
          ...authHeaders(key),
          'Content-Type': file.type,
          'x-upsert': 'false',
          'cache-control': '31536000',
        },
        body: file,
      });
      if (!response.ok) throw new Error(`Supabase Storage rechazó ${file.name}: ${await response.text()}`);
      urls.push(`${url}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodedObjectPath(objectPath)}`);
    }

    return NextResponse.json({ ok: true, data: { urls } });
  } catch (error) {
    console.error('Media upload:', error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'No fue posible subir la imagen.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ ok: false, message: 'Sesión administrativa no válida.' }, { status: 401 });

  try {
    const body = (await request.json()) as { url?: string };
    const mediaUrl = String(body.url || '');
    const { url, key } = config();
    const prefix = `${url}/storage/v1/object/public/${BUCKET}/`;
    const encodedPrefix = `${url}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;
    let path = mediaUrl.startsWith(prefix) ? mediaUrl.slice(prefix.length) : mediaUrl.startsWith(encodedPrefix) ? mediaUrl.slice(encodedPrefix.length) : '';

    // Imágenes antiguas o externas se quitan del producto sin borrar contenido de proveedores ajenos.
    if (!path) return NextResponse.json({ ok: true, data: null });
    path = path.split('/').map(decodeURIComponent).join('/');

    const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodedObjectPath(path)}`, {
      method: 'DELETE',
      headers: authHeaders(key),
    });
    if (!response.ok && response.status !== 404) throw new Error(await response.text());
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'No fue posible eliminar la imagen.' }, { status: 500 });
  }
}
