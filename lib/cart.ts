import type { OrderItem, Product, ProductVariant, Promotion } from '@/types';
import { PROMOTION_MAX_QTY } from './orders';
import { activeVariants, hasVariants, variantLabel, variantPrice } from './product';

export interface CartLine {
  /** Identifica la línea: mismo producto con distinta variante = línea distinta. */
  key: string;
  tipo: 'producto' | 'promocion';
  productId: string;
  slug: string;
  nombre: string;
  imagen: string;
  categoria: string;
  /** Precio unitario en USD. */
  precio: number;
  cantidad: number;
  /** Unidades disponibles al momento de agregar/sincronizar. */
  maxStock: number;
  varianteId: string;
  varianteNombre: string;
  color: string;
  colorHex: string;
  talla: string;
  opcion: string;
  opcionNombre: string;
  sku: string;
}

export type CartLineInput = Omit<CartLine, 'cantidad'>;

export function lineKey(productId: string, varianteId = '', tipo: CartLine['tipo'] = 'producto') {
  return `${tipo}:${productId}:${varianteId || 'base'}`;
}

export function lineFromProduct(product: Product, variant: ProductVariant | null): CartLineInput {
  return {
    key: lineKey(product.id, variant?.id),
    tipo: 'producto',
    productId: product.id,
    slug: product.slug,
    nombre: product.nombre,
    imagen: variant?.imagen || product.imagen,
    categoria: product.categoria,
    precio: variantPrice(product, variant),
    maxStock: variant ? variant.stock : product.stock,
    varianteId: variant?.id || '',
    varianteNombre: variant ? variantLabel(variant) : '',
    color: variant?.color?.nombre || '',
    colorHex: variant?.color?.hex || '',
    talla: variant?.talla || '',
    opcion: variant?.opcion || '',
    opcionNombre: variant?.opcion ? product.opcionVariante : '',
    sku: variant?.sku || product.sku,
  };
}

export function lineFromPromotion(promotion: Promotion): CartLineInput {
  return {
    key: lineKey(promotion.id, '', 'promocion'),
    tipo: 'promocion',
    productId: promotion.id,
    slug: '',
    nombre: promotion.titulo,
    imagen: promotion.imagen,
    categoria: 'Promoción',
    precio: promotion.precio,
    maxStock: PROMOTION_MAX_QTY,
    varianteId: '',
    varianteNombre: '',
    color: '',
    colorHex: '',
    talla: '',
    opcion: '',
    opcionNombre: '',
    sku: '',
  };
}

export function lineToOrderItem(line: CartLine): OrderItem {
  return {
    id: line.productId,
    productId: line.productId,
    tipo: line.tipo,
    nombre: line.nombre,
    precio: line.precio,
    cantidad: line.cantidad,
    subtotal: Math.round(line.precio * line.cantidad * 100) / 100,
    varianteId: line.varianteId || undefined,
    varianteNombre: line.varianteNombre || undefined,
    color: line.color || undefined,
    talla: line.talla || undefined,
    opcion: line.opcion || undefined,
    opcionNombre: line.opcionNombre || undefined,
    sku: line.sku || undefined,
    imagen: line.imagen || undefined,
  };
}

/** Valida una línea leída de localStorage (datos potencialmente antiguos o manipulados). */
export function sanitizeStoredLine(value: unknown): CartLine | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const productId = String(raw.productId || '').trim();
  const cantidad = Math.trunc(Number(raw.cantidad) || 0);
  if (!productId || cantidad <= 0) return null;
  const tipo = raw.tipo === 'promocion' ? 'promocion' : 'producto';
  const varianteId = String(raw.varianteId || '');
  const text = (key: string) => String(raw[key] ?? '');
  return {
    key: lineKey(productId, varianteId, tipo),
    tipo,
    productId,
    slug: text('slug'),
    nombre: text('nombre') || 'Producto',
    imagen: text('imagen'),
    categoria: text('categoria'),
    precio: Math.max(0, Number(raw.precio) || 0),
    cantidad,
    maxStock: Math.max(0, Math.trunc(Number(raw.maxStock) || 0)),
    varianteId,
    varianteNombre: text('varianteNombre'),
    color: text('color'),
    colorHex: text('colorHex'),
    talla: text('talla'),
    opcion: text('opcion'),
    opcionNombre: text('opcionNombre'),
    sku: text('sku'),
  };
}

export interface ReconcileResult {
  lines: CartLine[];
  changes: string[];
}

/**
 * Sincroniza el carrito con el catálogo real: actualiza precios y stock,
 * ajusta cantidades y retira productos o variantes que ya no existen.
 */
export function reconcileLines(lines: CartLine[], products: Product[], promotions: Promotion[] | null): ReconcileResult {
  const changes: string[] = [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const promosById = promotions ? new Map(promotions.map((promo) => [promo.id, promo])) : null;
  const next: CartLine[] = [];

  lines.forEach((line) => {
    if (line.tipo === 'promocion') {
      if (!promosById) {
        next.push(line);
        return;
      }
      const promo = promosById.get(line.productId);
      if (!promo || promo.activo === false) {
        changes.push(`La promoción "${line.nombre}" ya no está disponible y se retiró del carrito.`);
        return;
      }
      next.push({ ...lineFromPromotion(promo), cantidad: Math.min(line.cantidad, PROMOTION_MAX_QTY) });
      return;
    }

    const product = byId.get(line.productId);
    if (!product || !product.activo) {
      changes.push(`"${line.nombre}" ya no está disponible y se retiró del carrito.`);
      return;
    }

    let variant: ProductVariant | null = null;
    if (hasVariants(product)) {
      variant = activeVariants(product).find((item) => item.id === line.varianteId) || null;
      if (!variant) {
        changes.push(`La opción elegida de "${product.nombre}" ya no está disponible.`);
        return;
      }
    } else if (line.varianteId) {
      changes.push(`"${product.nombre}" cambió sus opciones; vuelve a agregarlo.`);
      return;
    }

    const fresh = lineFromProduct(product, variant);
    if (fresh.maxStock <= 0) {
      changes.push(`"${product.nombre}${fresh.varianteNombre ? ` (${fresh.varianteNombre})` : ''}" se agotó.`);
      return;
    }
    const cantidad = Math.min(line.cantidad, fresh.maxStock);
    if (cantidad < line.cantidad) {
      changes.push(`Ajustamos "${product.nombre}" a ${cantidad} unidad${cantidad === 1 ? '' : 'es'} disponibles.`);
    }
    if (Math.abs(fresh.precio - line.precio) > 0.001) {
      changes.push(`El precio de "${product.nombre}" se actualizó.`);
    }
    next.push({ ...fresh, cantidad });
  });

  return { lines: next, changes };
}
