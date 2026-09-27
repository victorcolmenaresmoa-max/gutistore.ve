import type { Category, Product } from '@/types';
import { normalizeText } from './text';

export interface StoreCategory {
  nombre: string;
  descripcion: string;
  imagen: string;
  orden: number;
  count: number;
  subcategorias: Array<{ nombre: string; count: number }>;
}

/**
 * Categorías visibles en la tienda: se generan a partir de los productos
 * activos y, si existen en la tabla `tienda_categorias`, toman de allí su orden,
 * descripción e imagen. Una categoría sin productos no se muestra.
 */
export function buildStoreCategories(products: Product[], categories: Category[]): StoreCategory[] {
  const meta = new Map(
    categories.filter((c) => !c.parentId).map((category) => [normalizeText(category.nombre), category])
  );
  const hidden = new Set(
    categories.filter((c) => !c.parentId && !c.activo).map((category) => normalizeText(category.nombre))
  );

  const groups = new Map<string, StoreCategory>();
  products.forEach((product) => {
    const key = normalizeText(product.categoria);
    if (!key || hidden.has(key)) return;
    const info = meta.get(key);
    const group =
      groups.get(key) ||
      ({
        nombre: info?.nombre || product.categoria,
        descripcion: info?.descripcion || '',
        imagen: info?.imagen || '',
        orden: info ? info.orden : 999,
        count: 0,
        subcategorias: [],
      } satisfies StoreCategory);
    group.count += 1;
    if (product.subcategoria) {
      const sub = group.subcategorias.find((item) => normalizeText(item.nombre) === normalizeText(product.subcategoria));
      if (sub) sub.count += 1;
      else group.subcategorias.push({ nombre: product.subcategoria, count: 1 });
    }
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      subcategorias: group.subcategorias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    }))
    .sort((a, b) => a.orden - b.orden || b.count - a.count || a.nombre.localeCompare(b.nombre, 'es'));
}

export type CategoryArtKind = 'ropa' | 'calzado' | 'lentes' | 'hidratacion' | 'suplementos' | 'accesorios' | 'gorras' | 'bolsos' | 'general';

const ART_KEYWORDS: Array<[CategoryArtKind, string[]]> = [
  ['suplementos', ['suplement', 'protein', 'creatin', 'vitamin', 'nutric', 'rendimiento', 'volumen', 'bienestar', 'pre-entreno', 'preentreno']],
  ['calzado', ['calzado', 'zapat', 'sneaker', 'tenis', 'bota', 'sandal']],
  ['lentes', ['lente', 'gafa', 'anteojo', 'sol']],
  ['hidratacion', ['hidrata', 'botella', 'shaker', 'termo', 'vaso']],
  ['gorras', ['gorra', 'sombrero', 'visera']],
  ['bolsos', ['bolso', 'morral', 'mochila', 'bag', 'cartera']],
  ['ropa', ['ropa', 'camisa', 'franela', 'sueter', 'hoodie', 'short', 'pantalon', 'legging', 'vestimenta', 'moda', 'chaqueta']],
  ['accesorios', ['accesorio', 'gym', 'guante', 'correa', 'cinturon', 'reloj', 'banda']],
];

export function categoryArtKind(name: string): CategoryArtKind {
  const key = normalizeText(name);
  const match = ART_KEYWORDS.find(([, words]) => words.some((word) => key.includes(word)));
  return match ? match[0] : 'general';
}
