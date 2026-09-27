import type { ColorValue, Product, ProductSpec, ProductVariant } from '@/types';
import { resolveColorHex, sanitizeHex } from './colors';
import { normalizeText, splitLines } from './text';

/* ============================================================
 *  Normalización: convierte cualquier dato (Supabase, localStorage,
 *  productos antiguos) en un Product completo con defaults seguros.
 * ============================================================ */

type Loose = Record<string, unknown>;

function asObject(value: unknown): Loose {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Loose) : {};
}

function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function int(value: unknown): number {
  return Math.max(0, Math.trunc(num(value)));
}

function bool(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') return ['true', '1', 'si', 'sí', 'yes'].includes(value.toLowerCase());
  return Boolean(value);
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => str(item)).filter(Boolean);
}

export function normalizeColor(value: unknown): ColorValue | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const nombre = value.trim();
    return nombre ? { nombre, hex: resolveColorHex(nombre) || undefined } : null;
  }
  const raw = asObject(value);
  const nombre = str(raw.nombre ?? raw.name);
  if (!nombre) return null;
  const hex = sanitizeHex(raw.hex);
  return hex ? { nombre, hex } : { nombre };
}

export function normalizeSpecs(value: unknown): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const raw = asObject(item);
      return { nombre: str(raw.nombre ?? raw.name), valor: str(raw.valor ?? raw.value) };
    })
    .filter((spec) => spec.nombre && spec.valor);
}

export function normalizeVariant(value: unknown, index = 0): ProductVariant {
  const raw = asObject(value);
  const precio = raw.precio === null || raw.precio === undefined || raw.precio === '' ? null : num(raw.precio, 0);
  return {
    id: str(raw.id) || `var-${index + 1}`,
    sku: str(raw.sku),
    color: normalizeColor(raw.color),
    talla: str(raw.talla),
    opcion: str(raw.opcion),
    precio: precio !== null && precio > 0 ? precio : null,
    stock: int(raw.stock),
    imagen: str(raw.imagen),
    activo: bool(raw.activo, true),
  };
}

export function normalizeProduct(value: unknown): Product {
  const raw = asObject(value);
  const nombre = str(raw.nombre) || 'Producto';
  const variantes = Array.isArray(raw.variantes) ? raw.variantes.map(normalizeVariant) : [];
  return {
    id: str(raw.id),
    slug: str(raw.slug),
    nombre,
    descripcionCorta: str(raw.descripcionCorta),
    descripcion: str(raw.descripcion),
    precio: Math.max(0, num(raw.precio)),
    precioAnterior: Math.max(0, num(raw.precioAnterior)),
    categoria: str(raw.categoria) || 'General',
    subcategoria: str(raw.subcategoria),
    marca: str(raw.marca),
    sku: str(raw.sku),
    imagen: str(raw.imagen),
    imagenes: asStringArray(raw.imagenes),
    stock: int(raw.stock),
    destacado: bool(raw.destacado),
    nuevo: bool(raw.nuevo),
    oferta: bool(raw.oferta),
    activo: bool(raw.activo, true),
    etiquetas: asStringArray(raw.etiquetas),
    caracteristicas: asStringArray(raw.caracteristicas),
    especificaciones: normalizeSpecs(raw.especificaciones),
    material: str(raw.material),
    genero: str(raw.genero),
    presentacion: str(raw.presentacion),
    capacidad: str(raw.capacidad),
    beneficios: str(raw.beneficios),
    ingredientes: str(raw.ingredientes),
    modoUso: str(raw.modoUso),
    informacionAdicional: str(raw.informacionAdicional),
    opcionVariante: str(raw.opcionVariante),
    variantes,
    createdAt: str(raw.createdAt),
  };
}

/* ============================================================
 *  Consultas sobre un producto
 * ============================================================ */

export function activeVariants(product: Product): ProductVariant[] {
  return product.variantes.filter((variant) => variant.activo);
}

export function hasVariants(product: Product): boolean {
  return activeVariants(product).length > 0;
}

/** Stock real: suma de variantes activas o stock general. */
export function totalStock(product: Product): number {
  return hasVariants(product)
    ? activeVariants(product).reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;
}

export function isInStock(product: Product): boolean {
  return totalStock(product) > 0;
}

export function variantPrice(product: Product, variant?: ProductVariant | null): number {
  return variant?.precio && variant.precio > 0 ? variant.precio : product.precio;
}

/** Rango de precios considerando variantes con precio propio. */
export function priceRange(product: Product): { min: number; max: number } {
  const prices = hasVariants(product)
    ? activeVariants(product).map((variant) => variantPrice(product, variant))
    : [product.precio];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Precio anterior solo si es mayor que el precio de venta. */
export function comparePrice(product: Product, price = product.precio): number {
  return product.precioAnterior > price ? product.precioAnterior : 0;
}

export function discountPercent(product: Product, price = product.precio): number {
  const previous = comparePrice(product, price);
  if (!previous || price <= 0) return 0;
  return Math.round((1 - price / previous) * 100);
}

/** Un producto está "en oferta" si se marcó así o si tiene precio anterior mayor. */
export function isOnSale(product: Product): boolean {
  return product.oferta || comparePrice(product) > 0;
}

export function productGallery(product: Product): string[] {
  const variantImages = product.variantes.map((variant) => variant.imagen);
  return Array.from(
    new Set([product.imagen, ...product.imagenes, ...variantImages].map((url) => str(url)).filter(Boolean))
  );
}

export function productUrl(product: Pick<Product, 'id' | 'slug'>): string {
  return `/producto/${encodeURIComponent(product.slug || product.id)}`;
}

/** Colores únicos (por nombre) de las variantes activas. */
export function productColors(product: Product): ColorValue[] {
  const map = new Map<string, ColorValue>();
  activeVariants(product).forEach((variant) => {
    if (variant.color && !map.has(normalizeText(variant.color.nombre))) {
      map.set(normalizeText(variant.color.nombre), variant.color);
    }
  });
  return Array.from(map.values());
}

const SIZE_ORDER = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', 'xxxl', '3xl', '4xl', 'unica', 'talla unica'];

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const na = Number(a.replace(',', '.'));
    const nb = Number(b.replace(',', '.'));
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    const ia = SIZE_ORDER.indexOf(normalizeText(a));
    const ib = SIZE_ORDER.indexOf(normalizeText(b));
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b, 'es');
  });
}

export function productSizes(product: Product): string[] {
  return sortSizes(Array.from(new Set(activeVariants(product).map((v) => v.talla).filter(Boolean))));
}

export function productOptions(product: Product): string[] {
  return Array.from(new Set(activeVariants(product).map((v) => v.opcion).filter(Boolean)));
}

export function benefitsList(product: Product): string[] {
  return splitLines(product.beneficios);
}

/** Texto corto para tarjetas: descripción corta o el inicio de la completa. */
export function productSummary(product: Product, max = 120): string {
  const base = product.descripcionCorta || product.descripcion;
  if (base.length <= max) return base;
  return `${base.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/** Nombre legible de una variante: "Negro / M / 750 ml". */
export function variantLabel(variant: ProductVariant): string {
  return [variant.color?.nombre, variant.talla, variant.opcion].filter(Boolean).join(' / ');
}

/* ============================================================
 *  Selección de variantes
 * ============================================================ */

export type VariantAxis = 'color' | 'talla' | 'opcion';

export type VariantSelection = Partial<Record<VariantAxis, string>>;

export function variantAxisValue(variant: ProductVariant, axis: VariantAxis): string {
  if (axis === 'color') return variant.color?.nombre || '';
  return variant[axis] || '';
}

/** Ejes que realmente usa el producto, en orden de presentación. */
export function productAxes(product: Product): VariantAxis[] {
  const variants = activeVariants(product);
  return (['color', 'talla', 'opcion'] as VariantAxis[]).filter((axis) =>
    variants.some((variant) => variantAxisValue(variant, axis))
  );
}

function matchesSelection(variant: ProductVariant, selection: VariantSelection, ignore?: VariantAxis) {
  return (Object.keys(selection) as VariantAxis[]).every((axis) => {
    if (axis === ignore) return true;
    const wanted = selection[axis];
    return !wanted || variantAxisValue(variant, axis) === wanted;
  });
}

export type OptionState = 'available' | 'unavailable-combination' | 'sold-out';

/**
 * Estado de un valor considerando lo elegido en los ejes ANTERIORES
 * (color → talla → opción). Así el color nunca queda bloqueado por la talla,
 * y las tallas/opciones reflejan el color elegido.
 * - unavailable-combination: esa combinación no existe (no seleccionable).
 * - sold-out: existe pero está agotada (no seleccionable).
 */
export function optionState(
  product: Product,
  axis: VariantAxis,
  value: string,
  selection: VariantSelection
): OptionState {
  const axes = productAxes(product);
  const prior = axes.slice(0, Math.max(0, axes.indexOf(axis)));
  const compatible = activeVariants(product).filter(
    (variant) =>
      variantAxisValue(variant, axis) === value &&
      prior.every((other) => !selection[other] || variantAxisValue(variant, other) === selection[other])
  );
  if (!compatible.length) return 'unavailable-combination';
  return compatible.some((variant) => variant.stock > 0) ? 'available' : 'sold-out';
}

/** Aplica una elección y limpia los ejes que dejan de ser compatibles. */
export function applySelection(
  product: Product,
  selection: VariantSelection,
  axis: VariantAxis,
  value: string
): VariantSelection {
  const next: VariantSelection = { ...selection, [axis]: value };
  const variants = activeVariants(product).filter((variant) => variant.stock > 0);
  (Object.keys(next) as VariantAxis[]).forEach((other) => {
    if (other === axis || !next[other]) return;
    const ok = variants.some(
      (variant) => variantAxisValue(variant, axis) === value && variantAxisValue(variant, other) === next[other]
    );
    if (!ok) delete next[other];
  });
  return next;
}

/** Variante que coincide con todos los ejes elegidos (o null si falta elegir). */
export function findSelectedVariant(product: Product, selection: VariantSelection): ProductVariant | null {
  const axes = productAxes(product);
  if (axes.some((axis) => !selection[axis])) return null;
  return (
    activeVariants(product).find((variant) =>
      axes.every((axis) => variantAxisValue(variant, axis) === selection[axis])
    ) || null
  );
}

/** Selección inicial: ejes con un único valor y el color de la primera variante disponible. */
export function initialSelection(product: Product): VariantSelection {
  const selection: VariantSelection = {};
  const variants = activeVariants(product);
  productAxes(product).forEach((axis) => {
    const values = Array.from(new Set(variants.map((variant) => variantAxisValue(variant, axis)).filter(Boolean)));
    if (values.length === 1) selection[axis] = values[0];
  });
  if (!selection.color) {
    const firstAvailable = variants.find((variant) => variant.stock > 0 && variant.color);
    if (firstAvailable?.color) selection.color = firstAvailable.color.nombre;
  }
  return selection;
}

export const AXIS_LABELS: Record<Exclude<VariantAxis, 'opcion'>, string> = {
  color: 'Color',
  talla: 'Talla',
};
