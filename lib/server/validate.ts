import type { CategoryInput, ProductInput, Promotion } from '@/types';

/**
 * Validación y limpieza de todo lo que llega desde el navegador antes de
 * guardarlo en Supabase. Nunca se confía en los datos que envía el cliente.
 */

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** Devuelve el id si tiene un formato seguro (uuid, número o slug); si no, ''. */
export function safeId(value: unknown): string {
  const id = String(value ?? '').trim();
  return ID_RE.test(id) ? id : '';
}

/** Texto limpio: sin caracteres de control y con largo máximo. */
export function cleanText(value: unknown, max: number): string {
  return String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function cleanNumber(value: unknown, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export function cleanInt(value: unknown, min: number, max: number): number {
  return Math.trunc(cleanNumber(value, min, max));
}

/**
 * Solo se aceptan fotos por HTTPS o rutas propias de la web (/catalogo/…).
 * Bloquea esquemas peligrosos como javascript: o data:.
 */
export function cleanImageUrl(value: unknown): string {
  let url = cleanText(value, 1000);
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return /[\s"'<>\\]/.test(url) ? '' : url;
  if (/^http:\/\//i.test(url)) url = `https://${url.slice(7)}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function cleanList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function cleanImageList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanImageUrl).filter(Boolean).slice(0, maxItems);
}

const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;

export function sanitizeProductInput(raw: Record<string, unknown>): ProductInput {
  const variants = Array.isArray(raw.variantes) ? raw.variantes.slice(0, 300) : [];
  const specs = Array.isArray(raw.especificaciones) ? raw.especificaciones.slice(0, 40) : [];
  return {
    slug: cleanText(raw.slug, 90),
    nombre: cleanText(raw.nombre, 160),
    descripcionCorta: cleanText(raw.descripcionCorta, 400),
    descripcion: cleanText(raw.descripcion, 8000),
    precio: cleanNumber(raw.precio, 0, MAX_PRICE),
    precioAnterior: cleanNumber(raw.precioAnterior, 0, MAX_PRICE),
    categoria: cleanText(raw.categoria, 80),
    subcategoria: cleanText(raw.subcategoria, 80),
    marca: cleanText(raw.marca, 80),
    sku: cleanText(raw.sku, 80),
    imagen: cleanImageUrl(raw.imagen),
    imagenes: cleanImageList(raw.imagenes, 20),
    stock: cleanInt(raw.stock, 0, MAX_STOCK),
    destacado: Boolean(raw.destacado),
    nuevo: Boolean(raw.nuevo),
    oferta: Boolean(raw.oferta),
    activo: raw.activo === undefined ? true : Boolean(raw.activo),
    etiquetas: cleanList(raw.etiquetas, 30, 60),
    caracteristicas: cleanList(raw.caracteristicas, 40, 300),
    especificaciones: specs.map((spec) => {
      const item = (spec && typeof spec === 'object' ? spec : {}) as Record<string, unknown>;
      return { nombre: cleanText(item.nombre, 80), valor: cleanText(item.valor, 300) };
    }),
    material: cleanText(raw.material, 200),
    genero: cleanText(raw.genero, 40),
    presentacion: cleanText(raw.presentacion, 200),
    capacidad: cleanText(raw.capacidad, 200),
    beneficios: cleanText(raw.beneficios, 4000),
    ingredientes: cleanText(raw.ingredientes, 4000),
    modoUso: cleanText(raw.modoUso, 4000),
    informacionAdicional: cleanText(raw.informacionAdicional, 4000),
    opcionVariante: cleanText(raw.opcionVariante, 60),
    variantes: variants.map((variant) => {
      const item = (variant && typeof variant === 'object' ? variant : {}) as Record<string, unknown>;
      const color = item.color && typeof item.color === 'object' ? (item.color as Record<string, unknown>) : null;
      const precio = item.precio === null || item.precio === undefined || item.precio === '' ? null : cleanNumber(item.precio, 0, MAX_PRICE);
      return {
        id: safeId(item.id),
        sku: cleanText(item.sku, 80),
        color: color ? { nombre: cleanText(color.nombre, 60), hex: cleanText(color.hex, 9) || undefined } : null,
        talla: cleanText(item.talla, 30),
        opcion: cleanText(item.opcion, 60),
        precio: precio && precio > 0 ? precio : null,
        stock: cleanInt(item.stock, 0, MAX_STOCK),
        imagen: cleanImageUrl(item.imagen),
        activo: item.activo === undefined ? true : Boolean(item.activo),
      };
    }),
  };
}

export function sanitizeCategoryInput(raw: Record<string, unknown>): CategoryInput {
  return {
    nombre: cleanText(raw.nombre, 80),
    slug: cleanText(raw.slug, 90),
    descripcion: cleanText(raw.descripcion, 500),
    imagen: cleanImageUrl(raw.imagen),
    parentId: safeId(raw.parentId) || null,
    orden: cleanInt(raw.orden, -1000, 1000),
    activo: raw.activo === undefined ? true : Boolean(raw.activo),
  } as CategoryInput;
}

export function sanitizePromotionInput(raw: Record<string, unknown>): Omit<Promotion, 'id'> {
  return {
    titulo: cleanText(raw.titulo, 160),
    descripcion: cleanText(raw.descripcion, 4000),
    productos: cleanText(raw.productos, 4000),
    precio: cleanNumber(raw.precio, 0, MAX_PRICE),
    precioRegular: cleanNumber(raw.precioRegular, 0, MAX_PRICE),
    imagen: cleanImageUrl(raw.imagen),
    imagenes: cleanImageList(raw.imagenes, 20),
    activo: raw.activo === undefined ? true : Boolean(raw.activo),
    destacado: Boolean(raw.destacado),
  };
}
