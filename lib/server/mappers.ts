import type {
  Category,
  CategoryInput,
  OrderItem,
  OrderRecord,
  Product,
  ProductInput,
  Promotion,
  Seller,
} from '@/types';
import { asStringArray, normalizeColor, normalizeProduct, normalizeSpecs, normalizeVariant } from '@/lib/product';
import { slugify } from '@/lib/text';

/* ============================================================
 *  Conversión entre filas de Supabase (snake_case) y los tipos
 *  de la aplicación. Toda columna nueva es opcional para seguir
 *  funcionando aunque la migración aún no se haya ejecutado.
 * ============================================================ */

export type DatabaseProduct = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number | string;
  categoria: string | null;
  imagen: string | null;
  galeria: unknown;
  stock: number | string;
  presentacion: string | null;
  beneficios: string | null;
  modo_uso: string | null;
  ingredientes: string | null;
  destacado: boolean | null;
  slug?: string | null;
  descripcion_corta?: string | null;
  precio_anterior?: number | string | null;
  subcategoria?: string | null;
  marca?: string | null;
  sku?: string | null;
  nuevo?: boolean | null;
  oferta?: boolean | null;
  activo?: boolean | null;
  etiquetas?: unknown;
  caracteristicas?: unknown;
  especificaciones?: unknown;
  material?: string | null;
  genero?: string | null;
  capacidad?: string | null;
  informacion_adicional?: string | null;
  opcion_variante?: string | null;
  variantes?: unknown;
  created_at?: string | null;
};

export type DatabaseCategory = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen: string | null;
  parent_id: string | null;
  orden: number | null;
  activo: boolean | null;
};

export type DatabasePromotion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  productos: string | null;
  precio: number | string;
  precio_regular: number | string | null;
  imagen: string | null;
  galeria: unknown;
  activo: boolean | null;
  destacado: boolean | null;
};

export type DatabaseSeller = {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  fecha_creacion: string;
};

export type DatabaseOrder = {
  id: string;
  fecha: string;
  cliente: string;
  telefono: string;
  email: string | null;
  ubicacion: string;
  direccion: string | null;
  metodo_entrega: string | null;
  metodo_pago: string | null;
  notas: string | null;
  items: unknown;
  total: number | string;
  vendedor_id: string | null;
  vendedor_codigo: string | null;
  vendedor_nombre: string | null;
  estado: string;
  control_stock?: boolean | null;
};

const text = (value: unknown) => String(value ?? '').trim();

/* ---------- Productos ---------- */

export function productFromRow(row: DatabaseProduct): Product {
  return normalizeProduct({
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcionCorta: row.descripcion_corta,
    descripcion: row.descripcion,
    precio: row.precio,
    precioAnterior: row.precio_anterior,
    categoria: row.categoria,
    subcategoria: row.subcategoria,
    marca: row.marca,
    sku: row.sku,
    imagen: row.imagen,
    imagenes: row.galeria,
    stock: row.stock,
    destacado: row.destacado,
    nuevo: row.nuevo,
    oferta: row.oferta,
    activo: row.activo ?? true,
    etiquetas: row.etiquetas,
    caracteristicas: row.caracteristicas,
    especificaciones: row.especificaciones,
    material: row.material,
    genero: row.genero,
    presentacion: row.presentacion,
    capacidad: row.capacidad,
    beneficios: row.beneficios,
    ingredientes: row.ingredientes,
    modoUso: row.modo_uso,
    informacionAdicional: row.informacion_adicional,
    opcionVariante: row.opcion_variante,
    variantes: row.variantes,
    createdAt: row.created_at,
  });
}

/** Columnas que existían antes de la migración. */
export function productToLegacyRow(product: ProductInput | Product) {
  return {
    nombre: text(product.nombre),
    descripcion: text(product.descripcion),
    precio: Number(product.precio) || 0,
    categoria: text(product.categoria) || 'General',
    imagen: text(product.imagen),
    galeria: asStringArray(product.imagenes),
    stock: Math.max(0, Math.trunc(Number(product.stock) || 0)),
    presentacion: text(product.presentacion),
    beneficios: text(product.beneficios),
    modo_uso: text(product.modoUso),
    ingredientes: text(product.ingredientes),
    destacado: Boolean(product.destacado),
  };
}

export function productToRow(product: ProductInput | Product, slug: string) {
  const variantes = (Array.isArray(product.variantes) ? product.variantes : [])
    .map((variant, index) => normalizeVariant(variant, index))
    .map((variant) => ({
      ...variant,
      id: variant.id.startsWith('var-') || !variant.id ? cryptoId() : variant.id,
      color: normalizeColor(variant.color),
    }));

  return {
    ...productToLegacyRow(product),
    slug,
    descripcion_corta: text(product.descripcionCorta),
    precio_anterior: Math.max(0, Number(product.precioAnterior) || 0),
    subcategoria: text(product.subcategoria),
    marca: text(product.marca),
    sku: text(product.sku),
    nuevo: Boolean(product.nuevo),
    oferta: Boolean(product.oferta),
    activo: product.activo === undefined ? true : Boolean(product.activo),
    etiquetas: asStringArray(product.etiquetas),
    caracteristicas: asStringArray(product.caracteristicas),
    especificaciones: normalizeSpecs(product.especificaciones),
    material: text(product.material),
    genero: text(product.genero),
    capacidad: text(product.capacidad),
    informacion_adicional: text(product.informacionAdicional),
    opcion_variante: text(product.opcionVariante),
    variantes,
  };
}

function cryptoId() {
  return globalThis.crypto?.randomUUID?.() || `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function desiredProductSlug(product: ProductInput | Product) {
  return slugify(product.slug || product.nombre) || 'producto';
}

/* ---------- Categorías ---------- */

export function categoryFromRow(row: DatabaseCategory): Category {
  return {
    id: row.id,
    nombre: text(row.nombre),
    slug: text(row.slug),
    descripcion: text(row.descripcion),
    imagen: text(row.imagen),
    parentId: row.parent_id || null,
    orden: Number(row.orden) || 0,
    activo: row.activo !== false,
  };
}

export function categoryToRow(category: CategoryInput, slug: string) {
  return {
    nombre: text(category.nombre),
    slug,
    descripcion: text(category.descripcion),
    imagen: text(category.imagen),
    parent_id: category.parentId || null,
    orden: Math.trunc(Number(category.orden) || 0),
    activo: category.activo === undefined ? true : Boolean(category.activo),
  };
}

/* ---------- Promociones ---------- */

export function promotionFromRow(row: DatabasePromotion): Promotion {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    productos: row.productos || '',
    precio: Number(row.precio) || 0,
    precioRegular: Number(row.precio_regular) || 0,
    imagen: row.imagen || '',
    imagenes: asStringArray(row.galeria),
    activo: row.activo !== false,
    destacado: Boolean(row.destacado),
  };
}

export function promotionToRow(promotion: Omit<Promotion, 'id'> | Promotion) {
  return {
    titulo: text(promotion.titulo),
    descripcion: text(promotion.descripcion),
    productos: text(promotion.productos),
    precio: Number(promotion.precio) || 0,
    precio_regular: Number(promotion.precioRegular) || 0,
    imagen: text(promotion.imagen),
    galeria: asStringArray(promotion.imagenes),
    activo: promotion.activo === undefined ? true : Boolean(promotion.activo),
    destacado: Boolean(promotion.destacado),
  };
}

/* ---------- Vendedores y pedidos ---------- */

export function sellerFromRow(row: DatabaseSeller): Seller {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    activo: Boolean(row.activo),
    fechaCreacion: row.fecha_creacion,
  };
}

export function orderItemsFromJson(value: unknown): OrderItem[] {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const item = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const precio = Number(item.precio) || 0;
    const cantidad = Math.max(0, Math.trunc(Number(item.cantidad) || 0));
    return {
      id: text(item.id || item.productId),
      productId: text(item.productId || item.id),
      tipo: item.tipo === 'promocion' ? 'promocion' : 'producto',
      nombre: text(item.nombre) || 'Producto',
      precio,
      cantidad,
      subtotal: Number(item.subtotal) || precio * cantidad,
      varianteId: text(item.varianteId),
      varianteNombre: text(item.varianteNombre),
      color: text(item.color),
      talla: text(item.talla),
      opcion: text(item.opcion),
      opcionNombre: text(item.opcionNombre),
      sku: text(item.sku),
      imagen: text(item.imagen),
    } satisfies OrderItem;
  });
}

export function orderFromRow(row: DatabaseOrder): OrderRecord {
  return {
    id: String(row.id),
    fecha: row.fecha,
    cliente: row.cliente || '',
    telefono: row.telefono || '',
    email: row.email || '',
    ubicacion: row.ubicacion || '',
    direccion: row.direccion || '',
    metodoEntrega: row.metodo_entrega || '',
    metodoPago: row.metodo_pago || '',
    notas: row.notas || '',
    items: orderItemsFromJson(row.items),
    total: Number(row.total) || 0,
    vendedorId: row.vendedor_id || '',
    vendedorCodigo: row.vendedor_codigo || '',
    vendedorNombre: row.vendedor_nombre || '',
    estado: row.estado || 'Pendiente',
    controlStock: Boolean(row.control_stock),
  };
}
