import type { Product } from '@/types';
import {
  activeVariants,
  isInStock,
  isOnSale,
  priceRange,
  productColors,
  productSizes,
  sortSizes,
} from './product';
import { normalizeText } from './text';

export type SortOption = 'relevancia' | 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre';

export const SORT_LABELS: Record<SortOption, string> = {
  relevancia: 'Relevancia',
  recientes: 'Más recientes',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  nombre: 'Nombre A-Z',
};

export interface CatalogFilters {
  q: string;
  categoria: string;
  subcategoria: string;
  marcas: string[];
  tallas: string[];
  colores: string[];
  min: number | null;
  max: number | null;
  disponible: boolean;
  oferta: boolean;
  nuevo: boolean;
  destacado: boolean;
  orden: SortOption;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: '',
  categoria: '',
  subcategoria: '',
  marcas: [],
  tallas: [],
  colores: [],
  min: null,
  max: null,
  disponible: false,
  oferta: false,
  nuevo: false,
  destacado: false,
  orden: 'relevancia',
};

/* ---------- URL <-> filtros ---------- */

function list(params: URLSearchParams, key: string) {
  return (params.get(key) || '').split(',').map((v) => v.trim()).filter(Boolean);
}

function numberOrNull(value: string | null) {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const orden = params.get('orden') as SortOption | null;
  return {
    q: params.get('q') || '',
    categoria: params.get('categoria') || '',
    subcategoria: params.get('sub') || '',
    marcas: list(params, 'marca'),
    tallas: list(params, 'talla'),
    colores: list(params, 'color'),
    min: numberOrNull(params.get('min')),
    max: numberOrNull(params.get('max')),
    disponible: params.get('stock') === '1',
    oferta: params.get('oferta') === '1',
    nuevo: params.get('nuevo') === '1',
    destacado: params.get('destacado') === '1',
    orden: orden && orden in SORT_LABELS ? orden : 'relevancia',
  };
}

export function filtersToQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.categoria) params.set('categoria', filters.categoria);
  if (filters.subcategoria) params.set('sub', filters.subcategoria);
  if (filters.marcas.length) params.set('marca', filters.marcas.join(','));
  if (filters.tallas.length) params.set('talla', filters.tallas.join(','));
  if (filters.colores.length) params.set('color', filters.colores.join(','));
  if (filters.min !== null) params.set('min', String(filters.min));
  if (filters.max !== null) params.set('max', String(filters.max));
  if (filters.disponible) params.set('stock', '1');
  if (filters.oferta) params.set('oferta', '1');
  if (filters.nuevo) params.set('nuevo', '1');
  if (filters.destacado) params.set('destacado', '1');
  if (filters.orden !== 'relevancia') params.set('orden', filters.orden);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function categoryHref(categoria: string, subcategoria = '') {
  return `/tienda${filtersToQuery({ ...EMPTY_FILTERS, categoria, subcategoria })}`;
}

/* ---------- Búsqueda ---------- */

function searchableText(product: Product) {
  return normalizeText(
    [
      product.nombre,
      product.descripcionCorta,
      product.descripcion,
      product.marca,
      product.categoria,
      product.subcategoria,
      product.sku,
      product.etiquetas.join(' '),
      activeVariants(product)
        .map((v) => [v.color?.nombre, v.talla, v.opcion, v.sku].join(' '))
        .join(' '),
    ].join(' ')
  );
}

/** Puntuación simple de relevancia: nombre > marca/categoría > etiquetas > descripción. */
function relevance(product: Product, terms: string[]) {
  if (!terms.length) return 0;
  const name = normalizeText(product.nombre);
  const meta = normalizeText([product.marca, product.categoria, product.subcategoria].join(' '));
  const tags = normalizeText(product.etiquetas.join(' '));
  return terms.reduce((score, term) => {
    if (name.startsWith(term)) score += 8;
    else if (name.includes(term)) score += 5;
    if (meta.includes(term)) score += 3;
    if (tags.includes(term)) score += 2;
    return score + 1;
  }, 0);
}

/* ---------- Filtrado ---------- */

type FilterKey = keyof Omit<CatalogFilters, 'orden'>;

function matches(product: Product, filters: CatalogFilters, terms: string[], skip?: FilterKey) {
  if (skip !== 'q' && terms.length) {
    const text = searchableText(product);
    if (!terms.every((term) => text.includes(term))) return false;
  }
  if (skip !== 'categoria' && filters.categoria && normalizeText(product.categoria) !== normalizeText(filters.categoria)) return false;
  if (skip !== 'subcategoria' && filters.subcategoria && normalizeText(product.subcategoria) !== normalizeText(filters.subcategoria)) return false;
  if (skip !== 'marcas' && filters.marcas.length && !filters.marcas.includes(product.marca)) return false;
  if (skip !== 'tallas' && filters.tallas.length) {
    const sizes = activeVariants(product).filter((v) => v.stock > 0 || !filters.disponible).map((v) => v.talla);
    if (!filters.tallas.some((size) => sizes.includes(size))) return false;
  }
  if (skip !== 'colores' && filters.colores.length) {
    const colors = productColors(product).map((c) => normalizeText(c.nombre));
    if (!filters.colores.some((color) => colors.includes(normalizeText(color)))) return false;
  }
  if (skip !== 'min' && filters.min !== null && priceRange(product).max < filters.min) return false;
  if (skip !== 'max' && filters.max !== null && priceRange(product).min > filters.max) return false;
  if (skip !== 'disponible' && filters.disponible && !isInStock(product)) return false;
  if (skip !== 'oferta' && filters.oferta && !isOnSale(product)) return false;
  if (skip !== 'nuevo' && filters.nuevo && !product.nuevo) return false;
  if (skip !== 'destacado' && filters.destacado && !product.destacado) return false;
  return true;
}

function termsOf(q: string) {
  return normalizeText(q).split(/\s+/).filter(Boolean);
}

export function applyCatalog(products: Product[], filters: CatalogFilters): Product[] {
  const terms = termsOf(filters.q);
  const result = products.filter((product) => matches(product, filters, terms));
  const byTime = (p: Product) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);

  return result.sort((a, b) => {
    switch (filters.orden) {
      case 'precio-asc':
        return priceRange(a).min - priceRange(b).min;
      case 'precio-desc':
        return priceRange(b).min - priceRange(a).min;
      case 'nombre':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'recientes':
        return byTime(b) - byTime(a);
      default: {
        const diff = relevance(b, terms) - relevance(a, terms);
        if (diff) return diff;
        // Sin búsqueda: disponibles primero, luego destacados y nuevos.
        const stockDiff = Number(isInStock(b)) - Number(isInStock(a));
        if (stockDiff) return stockDiff;
        const flagDiff = Number(b.destacado) * 2 + Number(b.nuevo) - (Number(a.destacado) * 2 + Number(a.nuevo));
        return flagDiff || a.nombre.localeCompare(b.nombre, 'es');
      }
    }
  });
}

/* ---------- Facetas (opciones disponibles para cada filtro) ---------- */

export interface Facet {
  value: string;
  count: number;
  hex?: string;
}

export interface CatalogFacets {
  categorias: Facet[];
  subcategorias: Facet[];
  marcas: Facet[];
  tallas: Facet[];
  colores: Facet[];
  precio: { min: number; max: number };
  hayOfertas: boolean;
  hayNuevos: boolean;
  hayDestacados: boolean;
}

function countBy(values: string[]): Facet[] {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
  return Array.from(map.entries()).map(([value, count]) => ({ value, count }));
}

/**
 * Cada faceta se calcula aplicando todos los filtros excepto el suyo, para que
 * el usuario siempre vea opciones que devuelven resultados.
 */
export function computeFacets(products: Product[], filters: CatalogFilters): CatalogFacets {
  const terms = termsOf(filters.q);
  const scope = (skip: FilterKey) => products.filter((p) => matches(p, filters, terms, skip));

  const categorias = countBy(scope('categoria').map((p) => p.categoria)).sort((a, b) => a.value.localeCompare(b.value, 'es'));
  const subcategorias = countBy(
    scope('subcategoria')
      .filter((p) => !filters.categoria || normalizeText(p.categoria) === normalizeText(filters.categoria))
      .map((p) => p.subcategoria)
  ).sort((a, b) => a.value.localeCompare(b.value, 'es'));
  const marcas = countBy(scope('marcas').map((p) => p.marca)).sort((a, b) => a.value.localeCompare(b.value, 'es'));

  const sizeFacets = countBy(scope('tallas').flatMap((p) => productSizes(p)));
  const sizeOrder = sortSizes(sizeFacets.map((f) => f.value));
  const tallas = sizeOrder.map((value) => sizeFacets.find((f) => f.value === value) as Facet);

  const colorMap = new Map<string, Facet>();
  scope('colores').forEach((p) =>
    productColors(p).forEach((color) => {
      const key = normalizeText(color.nombre);
      const current = colorMap.get(key);
      if (current) current.count += 1;
      else colorMap.set(key, { value: color.nombre, count: 1, hex: color.hex });
    })
  );

  const allPrices = products.flatMap((p) => {
    const range = priceRange(p);
    return [range.min, range.max];
  });

  return {
    categorias,
    subcategorias,
    marcas,
    tallas,
    colores: Array.from(colorMap.values()).sort((a, b) => a.value.localeCompare(b.value, 'es')),
    precio: {
      min: allPrices.length ? Math.floor(Math.min(...allPrices)) : 0,
      max: allPrices.length ? Math.ceil(Math.max(...allPrices)) : 0,
    },
    hayOfertas: products.some(isOnSale),
    hayNuevos: products.some((p) => p.nuevo),
    hayDestacados: products.some((p) => p.destacado),
  };
}

/** Cuenta los filtros activos (sin contar búsqueda ni orden). */
export function activeFilterCount(filters: CatalogFilters) {
  return (
    (filters.categoria ? 1 : 0) +
    (filters.subcategoria ? 1 : 0) +
    filters.marcas.length +
    filters.tallas.length +
    filters.colores.length +
    (filters.min !== null ? 1 : 0) +
    (filters.max !== null ? 1 : 0) +
    Number(filters.disponible) +
    Number(filters.oferta) +
    Number(filters.nuevo) +
    Number(filters.destacado)
  );
}

/** Productos relacionados: misma subcategoría, luego misma categoría, luego etiquetas compartidas. */
export function relatedProducts(product: Product, products: Product[], limit = 4): Product[] {
  const others = products.filter((p) => p.id !== product.id && p.activo);
  const tagSet = new Set(product.etiquetas.map(normalizeText));
  const score = (p: Product) =>
    (product.subcategoria && p.subcategoria === product.subcategoria ? 6 : 0) +
    (p.categoria === product.categoria ? 4 : 0) +
    (product.marca && p.marca === product.marca ? 2 : 0) +
    p.etiquetas.filter((t) => tagSet.has(normalizeText(t))).length +
    (isInStock(p) ? 1 : 0);
  return others
    .map((p) => ({ p, s: score(p) }))
    .filter(({ s }) => s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ p }) => p);
}
