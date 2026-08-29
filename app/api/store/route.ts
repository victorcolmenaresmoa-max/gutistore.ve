import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';
import { supabaseRest } from '@/lib/supabase-rest';
import { slugify } from '@/lib/slug';
import type {
  ApiResponse,
  Category,
  OrderItem,
  OrderPayload,
  OrderRecord,
  Product,
  ProductAttribute,
  ProductVariant,
  Promotion,
  Seller,
  StoreConfig,
} from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ACTIONS = new Set([
  'addProduct', 'updateProduct', 'deleteProduct',
  'addCategory', 'updateCategory', 'deleteCategory',
  'getOrders', 'updateOrderStatus',
  'addPromotion', 'updatePromotion', 'deletePromotion',
  'updateConfig', 'getSellers', 'addSeller', 'updateSeller',
]);

const VALID_ORDER_STATUSES = new Set([
  'Pendiente', 'Contactado', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado',
]);

const PRODUCT_STATUSES = new Set(['active', 'draft', 'archived']);

type DatabaseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  display_order: number | string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at?: string;
  updated_at?: string;
};

type DatabaseVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  price: number | string | null;
  compare_at_price: number | string | null;
  stock: number | string | null;
  image: string | null;
  active: boolean | null;
  attributes: unknown;
  created_at?: string;
  updated_at?: string;
};

type DatabaseProduct = {
  id: string;
  nombre: string;
  slug?: string | null;
  descripcion: string | null;
  descripcion_corta?: string | null;
  precio: number | string;
  precio_anterior?: number | string | null;
  categoria: string | null;
  categoria_id?: string | null;
  marca?: string | null;
  sku?: string | null;
  imagen: string | null;
  galeria: unknown;
  stock: number | string;
  estado?: string | null;
  activo?: boolean | null;
  presentacion: string | null;
  beneficios: string | null;
  modo_uso: string | null;
  ingredientes: string | null;
  destacado: boolean | null;
  promocion_activa?: boolean | null;
  atributos?: unknown;
  created_at?: string;
  updated_at?: string;
};

type DatabasePromotion = {
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

type DatabaseSeller = {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  fecha_creacion: string;
};

type DatabaseOrder = {
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
};

function json<T>(payload: ApiResponse<T>, status = 200) {
  return NextResponse.json(payload, { status });
}

function getAction(body: unknown) {
  if (!body || typeof body !== 'object' || !('action' in body)) return '';
  return String((body as Record<string, unknown>).action || '');
}

function getObject(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const value = (body as Record<string, unknown>)[key];
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function asAttributes(value: unknown): ProductAttribute[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name || '').trim();
      const attrValue = String(row.value || '').trim();
      return name && attrValue ? { name, value: attrValue } : null;
    })
    .filter((item): item is ProductAttribute => Boolean(item));
}

function asVariantAttributes(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => [String(key).trim(), String(val ?? '').trim()])
      .filter(([key, val]) => key && val)
  );
}

function asOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const precio = Math.max(0, Number(row.precio) || 0);
    const cantidad = Math.max(1, Math.trunc(Number(row.cantidad) || 1));
    const promotionId = String(row.promotionId || '').trim();
    const productId = String(row.productId || (!promotionId ? row.id : '') || '').trim();
    const attributes = asVariantAttributes(row.atributos);
    return {
      id: String(row.id || productId || '').trim(),
      productId: productId || undefined,
      promotionId: promotionId || undefined,
      variantId: String(row.variantId || '').trim() || undefined,
      nombre: String(row.nombre || 'Producto').trim(),
      sku: String(row.sku || '').trim() || undefined,
      imagen: String(row.imagen || '').trim() || undefined,
      atributos: Object.keys(attributes).length ? attributes : undefined,
      variante: String(row.variante || '').trim() || undefined,
      precio,
      cantidad,
      subtotal: Number(row.subtotal) || Number((precio * cantidad).toFixed(2)),
    };
  });
}

function categoryFromRow(row: DatabaseCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    image: row.image || '',
    displayOrder: Number(row.display_order) || 0,
    isActive: row.is_active !== false,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function categoryToRow(category: Omit<Category, 'id'> | Category, slug: string) {
  return {
    name: String(category.name || '').trim(),
    slug,
    description: String(category.description || '').trim(),
    image: String(category.image || '').trim(),
    display_order: Math.max(0, Math.trunc(Number(category.displayOrder) || 0)),
    is_active: category.isActive !== false,
    is_featured: Boolean(category.isFeatured),
  };
}

function variantFromRow(row: DatabaseVariant): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku || '',
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    compareAtPrice: row.compare_at_price === null || row.compare_at_price === undefined ? null : Number(row.compare_at_price),
    stock: Math.max(0, Math.trunc(Number(row.stock) || 0)),
    image: row.image || '',
    active: row.active !== false,
    attributes: asVariantAttributes(row.attributes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function productFromRow(
  row: DatabaseProduct,
  category?: DatabaseCategory,
  variants: DatabaseVariant[] = []
): Product {
  const mappedVariants = variants.map(variantFromRow).filter((variant) => variant.active);
  const stock = mappedVariants.length > 0
    ? mappedVariants.reduce((sum, variant) => sum + variant.stock, 0)
    : Math.max(0, Math.trunc(Number(row.stock) || 0));

  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug || slugify(row.nombre) || row.id,
    descripcion: row.descripcion || '',
    descripcionCorta: row.descripcion_corta || '',
    precio: Number(row.precio) || 0,
    precioAnterior: row.precio_anterior === null || row.precio_anterior === undefined ? null : Number(row.precio_anterior),
    categoria: category?.name || row.categoria || 'General',
    categoriaId: category?.id || row.categoria_id || undefined,
    categoriaSlug: category?.slug || undefined,
    marca: row.marca || '',
    sku: row.sku || '',
    imagen: row.imagen || '',
    imagenes: asStringArray(row.galeria),
    stock,
    estado: PRODUCT_STATUSES.has(String(row.estado)) ? (row.estado as Product['estado']) : 'active',
    activo: row.activo !== false,
    destacado: Boolean(row.destacado),
    promocionActiva: Boolean(row.promocion_activa),
    atributos: asAttributes(row.atributos),
    variantes: mappedVariants,
    presentacion: row.presentacion || '',
    beneficios: row.beneficios || '',
    modoUso: row.modo_uso || '',
    ingredientes: row.ingredientes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function productToRow(product: Omit<Product, 'id'> | Product, slug: string) {
  const variants = Array.isArray(product.variantes) ? product.variantes.filter((variant) => variant.active !== false) : [];
  const stock = variants.length
    ? variants.reduce((sum, variant) => sum + Math.max(0, Math.trunc(Number(variant.stock) || 0)), 0)
    : Math.max(0, Math.trunc(Number(product.stock) || 0));

  return {
    nombre: String(product.nombre || '').trim(),
    slug,
    descripcion: String(product.descripcion || '').trim(),
    descripcion_corta: String(product.descripcionCorta || '').trim(),
    precio: Math.max(0, Number(product.precio) || 0),
    precio_anterior: product.precioAnterior ? Math.max(0, Number(product.precioAnterior)) : null,
    categoria: String(product.categoria || 'General').trim() || 'General',
    categoria_id: String(product.categoriaId || '').trim() || null,
    marca: String(product.marca || '').trim(),
    sku: String(product.sku || '').trim(),
    imagen: String(product.imagen || '').trim(),
    galeria: asStringArray(product.imagenes),
    stock,
    estado: PRODUCT_STATUSES.has(String(product.estado)) ? product.estado : 'active',
    activo: product.activo !== false,
    presentacion: String(product.presentacion || '').trim(),
    beneficios: String(product.beneficios || '').trim(),
    modo_uso: String(product.modoUso || '').trim(),
    ingredientes: String(product.ingredientes || '').trim(),
    destacado: Boolean(product.destacado),
    promocion_activa: Boolean(product.promocionActiva),
    atributos: asAttributes(product.atributos),
  };
}

function promotionFromRow(row: DatabasePromotion): Promotion {
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

function promotionToRow(promotion: Omit<Promotion, 'id'> | Promotion) {
  return {
    titulo: String(promotion.titulo || '').trim(),
    descripcion: String(promotion.descripcion || '').trim(),
    productos: String(promotion.productos || '').trim(),
    precio: Number(promotion.precio) || 0,
    precio_regular: Number(promotion.precioRegular) || 0,
    imagen: String(promotion.imagen || '').trim(),
    galeria: asStringArray(promotion.imagenes),
    activo: promotion.activo === undefined ? true : Boolean(promotion.activo),
    destacado: Boolean(promotion.destacado),
  };
}

function sellerFromRow(row: DatabaseSeller): Seller {
  return { id: row.id, nombre: row.nombre, codigo: row.codigo, activo: Boolean(row.activo), fechaCreacion: row.fecha_creacion };
}

function orderFromRow(row: DatabaseOrder): OrderRecord {
  return {
    id: row.id,
    fecha: row.fecha,
    cliente: row.cliente,
    telefono: row.telefono,
    email: row.email || '',
    ubicacion: row.ubicacion,
    direccion: row.direccion || '',
    metodoEntrega: row.metodo_entrega || '',
    metodoPago: row.metodo_pago || '',
    notas: row.notas || '',
    items: asOrderItems(row.items),
    total: Number(row.total) || 0,
    vendedorId: row.vendedor_id || '',
    vendedorCodigo: row.vendedor_codigo || '',
    vendedorNombre: row.vendedor_nombre || '',
    estado: row.estado || 'Pendiente',
  };
}

async function fetchCategories(): Promise<DatabaseCategory[]> {
  return supabaseRest<DatabaseCategory[]>('categorias', { query: { select: '*', order: 'display_order.asc,name.asc' } });
}

async function fetchVariantsForProducts(productIds: string[]): Promise<DatabaseVariant[]> {
  if (!productIds.length) return [];
  return supabaseRest<DatabaseVariant[]>('variantes_producto', {
    query: { select: '*', product_id: `in.(${productIds.join(',')})`, order: 'created_at.asc' },
  });
}

async function fetchProductBundle(idOrSlug: string): Promise<Product | null> {
  const value = String(idOrSlug || '').trim();
  if (!value) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const rows = await supabaseRest<DatabaseProduct[]>('productos', {
    query: isUuid
      ? { select: '*', id: `eq.${value}`, limit: '1' }
      : { select: '*', slug: `eq.${value}`, limit: '1' },
  });
  const row = rows[0];
  if (!row) return null;
  const [categories, variants] = await Promise.all([
    row.categoria_id
      ? supabaseRest<DatabaseCategory[]>('categorias', { query: { select: '*', id: `eq.${row.categoria_id}`, limit: '1' } })
      : Promise.resolve([]),
    supabaseRest<DatabaseVariant[]>('variantes_producto', { query: { select: '*', product_id: `eq.${row.id}`, order: 'created_at.asc' } }),
  ]);
  return productFromRow(row, categories[0], variants);
}

async function uniqueSlug(table: 'productos' | 'categorias', desired: string, excludedId?: string) {
  const base = slugify(desired) || (table === 'productos' ? 'producto' : 'categoria');
  let candidate = base;
  let suffix = 2;
  while (true) {
    const query: Record<string, string> = { select: 'id', slug: `eq.${candidate}`, limit: '1' };
    if (excludedId) query.id = `neq.${excludedId}`;
    const rows = await supabaseRest<Array<{ id: string }>>(table, { query });
    if (!rows.length) return candidate;
    candidate = `${base.slice(0, 80)}-${suffix++}`;
  }
}

async function syncVariants(productId: string, variants: ProductVariant[] = []) {
  const existing = await supabaseRest<DatabaseVariant[]>('variantes_producto', {
    query: { select: '*', product_id: `eq.${productId}` },
  });
  const submittedIds = new Set(variants.map((variant) => variant.id).filter(Boolean) as string[]);

  for (const row of existing) {
    if (!submittedIds.has(row.id)) {
      await supabaseRest('variantes_producto', {
        method: 'PATCH',
        query: { id: `eq.${row.id}`, product_id: `eq.${productId}` },
        body: { active: false },
      });
    }
  }

  for (const variant of variants) {
    const payload = {
      product_id: productId,
      sku: String(variant.sku || '').trim(),
      price: variant.price === null || variant.price === undefined || variant.price === 0 ? null : Math.max(0, Number(variant.price)),
      compare_at_price: variant.compareAtPrice ? Math.max(0, Number(variant.compareAtPrice)) : null,
      stock: Math.max(0, Math.trunc(Number(variant.stock) || 0)),
      image: String(variant.image || '').trim(),
      active: variant.active !== false,
      attributes: asVariantAttributes(variant.attributes),
    };
    if (variant.id && existing.some((row) => row.id === variant.id)) {
      await supabaseRest('variantes_producto', { method: 'PATCH', query: { id: `eq.${variant.id}` }, body: payload });
    } else {
      await supabaseRest('variantes_producto', { method: 'POST', body: payload });
    }
  }
}

function normalizeSellerCode(value: unknown) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40);
}

function sellerCodeBaseFromName(name: string) {
  return normalizeSellerCode(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')) || 'VENDEDOR';
}

async function sellerCodeExists(code: string, excludedId?: string) {
  const query: Record<string, string> = { select: 'id', codigo: `eq.${code}`, limit: '1' };
  if (excludedId) query.id = `neq.${excludedId}`;
  const rows = await supabaseRest<Array<{ id: string }>>('vendedores', { query });
  return rows.length > 0;
}

async function createUniqueSellerCode(name: string, requestedCode: unknown, excludedId?: string) {
  const base = normalizeSellerCode(requestedCode) || sellerCodeBaseFromName(name);
  let candidate = base;
  let suffix = 2;
  while (await sellerCodeExists(candidate, excludedId)) candidate = `${base.slice(0, 35)}-${suffix++}`;
  return candidate;
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
}

async function sendAdminOrderEmail(order: OrderRecord) {
  const apiKey = process.env.RESEND_API_KEY || '';
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL || '';
  const from = process.env.EMAIL_FROM || 'GutiStore <onboarding@resend.dev>';
  if (!apiKey || !recipient) return false;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const orderUrl = appUrl ? `${appUrl}/admin?pedido=${encodeURIComponent(order.id)}` : '';
  const itemRows = order.items.map((item) => {
    const attrs = item.atributos && Object.keys(item.atributos).length
      ? Object.entries(item.atributos).map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(value)}`).join(' · ')
      : escapeHtml(item.variante || '');
    return `<tr><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(item.nombre)}</strong>${attrs ? `<br><small>${attrs}</small>` : ''}${item.sku ? `<br><small>SKU: ${escapeHtml(item.sku)}</small>` : ''}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.cantidad}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${Number(item.precio).toFixed(2)}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${Number(item.subtotal ?? item.precio * item.cantidad).toFixed(2)}</td></tr>`;
  }).join('');

  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f6;font-family:Arial,sans-serif;color:#171719"><div style="max-width:720px;margin:0 auto;padding:28px 14px"><div style="background:#0b0b0d;border-radius:18px 18px 0 0;padding:24px;color:#fff"><div style="font-size:26px;font-weight:800"><span style="color:#fff">Guti</span><span style="color:#ff2535">Store</span></div><div style="margin-top:8px;color:#bbb">NUEVO PEDIDO – GUTISTORE</div></div><div style="background:#fff;padding:26px;border-radius:0 0 18px 18px"><h2 style="margin-top:0">Pedido #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</h2><p><strong>Fecha:</strong> ${escapeHtml(new Date(order.fecha).toLocaleString('es-VE'))}<br><strong>Cliente:</strong> ${escapeHtml(order.cliente)}<br><strong>Teléfono:</strong> ${escapeHtml(order.telefono || 'No indicado')}<br><strong>Email:</strong> ${escapeHtml(order.email || 'No indicado')}<br><strong>Ubicación:</strong> ${escapeHtml(order.ubicacion)}<br><strong>Dirección:</strong> ${escapeHtml(order.direccion || 'No aplica')}<br><strong>Entrega:</strong> ${escapeHtml(order.metodoEntrega)}<br><strong>Pago:</strong> ${escapeHtml(order.metodoPago)}<br><strong>Estado:</strong> ${escapeHtml(order.estado)}</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><thead><tr><th style="text-align:left;padding:10px;background:#fafafa">Producto</th><th style="padding:10px;background:#fafafa">Cant.</th><th style="text-align:right;padding:10px;background:#fafafa">Precio</th><th style="text-align:right;padding:10px;background:#fafafa">Subtotal</th></tr></thead><tbody>${itemRows}</tbody></table><p style="font-size:22px;text-align:right"><strong>Total: $${order.total.toFixed(2)} USD</strong></p>${orderUrl ? `<p style="text-align:center;margin-top:28px"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#ff2535;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700">Ver pedido</a></p>` : ''}</div></div></body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [recipient], subject: `Nuevo pedido GutiStore #${order.id.slice(0, 8).toUpperCase()}`, html }),
  });
  if (!response.ok) console.error('Resend:', await response.text());
  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = getAction(body);
    const isAdmin = isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

    if (!action) return json({ ok: false, message: 'Acción requerida.' }, 400);
    if (ADMIN_ACTIONS.has(action) && !isAdmin) return json({ ok: false, message: 'Sesión administrativa no válida.' }, 401);

    switch (action) {
      case 'getCategories': {
        let rows = await fetchCategories();
        if (!isAdmin) rows = rows.filter((row) => row.is_active !== false);
        return json({ ok: true, data: rows.map(categoryFromRow) });
      }

      case 'addCategory': {
        const input = getObject(body, 'category') as unknown as Omit<Category, 'id'> | null;
        if (!input || !String(input.name || '').trim()) return json({ ok: false, message: 'El nombre de la categoría es obligatorio.' }, 400);
        const slug = await uniqueSlug('categorias', input.slug || input.name);
        const rows = await supabaseRest<DatabaseCategory[]>('categorias', { method: 'POST', body: categoryToRow(input, slug), prefer: 'return=representation' });
        return json({ ok: true, data: categoryFromRow(rows[0]) });
      }

      case 'updateCategory': {
        const input = getObject(body, 'category') as unknown as Category | null;
        if (!input?.id || !String(input.name || '').trim()) return json({ ok: false, message: 'Datos de categoría incompletos.' }, 400);
        const slug = await uniqueSlug('categorias', input.slug || input.name, input.id);
        const rows = await supabaseRest<DatabaseCategory[]>('categorias', { method: 'PATCH', query: { id: `eq.${input.id}` }, body: categoryToRow(input, slug), prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Categoría no encontrada.' }, 404);
        return json({ ok: true, data: categoryFromRow(rows[0]) });
      }

      case 'deleteCategory': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de categoría requerido.' }, 400);
        const products = await supabaseRest<Array<{ id: string }>>('productos', { query: { select: 'id', categoria_id: `eq.${id}`, limit: '1' } });
        if (products.length) return json({ ok: false, message: 'Esta categoría contiene productos. Muévelos a otra categoría o desactiva la categoría para conservar la integridad del catálogo.' }, 409);
        await supabaseRest('categorias', { method: 'DELETE', query: { id: `eq.${id}` } });
        return json({ ok: true, data: null });
      }

      case 'getProducts': {
        const [rows, categories] = await Promise.all([
          supabaseRest<DatabaseProduct[]>('productos', { query: { select: '*', order: 'destacado.desc,created_at.desc,nombre.asc' } }),
          fetchCategories(),
        ]);
        const variants = await fetchVariantsForProducts(rows.map((row) => row.id));
        const categoryMap = new Map(categories.map((category) => [category.id, category]));
        let products = rows.map((row) => productFromRow(row, row.categoria_id ? categoryMap.get(row.categoria_id) : undefined, variants.filter((variant) => variant.product_id === row.id)));
        if (!isAdmin) products = products.filter((product) => product.activo !== false && product.estado === 'active' && (!product.categoriaId || categoryMap.get(product.categoriaId)?.is_active !== false));

        const categorySlug = String(body.categorySlug || '').trim();
        if (categorySlug) products = products.filter((product) => product.categoriaSlug === categorySlug);
        const term = String(body.search || '').trim().toLowerCase();
        if (term) {
          const terms = term.split(/\s+/).filter(Boolean);
          products = products.filter((product) => {
            const searchable = [product.nombre, product.marca, product.categoria, product.descripcion, product.descripcionCorta, product.sku,
              ...(product.atributos || []).flatMap((attr) => [attr.name, attr.value]),
              ...(product.variantes || []).flatMap((variant) => [variant.sku, ...Object.keys(variant.attributes), ...Object.values(variant.attributes)])]
              .filter(Boolean).join(' ').toLowerCase();
            return terms.every((word) => searchable.includes(word));
          });
        }
        return json({ ok: true, data: products });
      }

      case 'getProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID o slug de producto requerido.' }, 400);
        const product = await fetchProductBundle(id);
        if (!product || (!isAdmin && (product.activo === false || product.estado !== 'active'))) return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        return json({ ok: true, data: product });
      }

      case 'addProduct': {
        const input = getObject(body, 'product') as unknown as Omit<Product, 'id'> | null;
        if (!input || !String(input.nombre || '').trim() || input.precio === undefined) return json({ ok: false, message: 'Nombre y precio son obligatorios.' }, 400);
        if (!String(input.categoriaId || '').trim()) return json({ ok: false, message: 'Selecciona una categoría.' }, 400);
        const slug = await uniqueSlug('productos', input.slug || input.nombre);
        const rows = await supabaseRest<DatabaseProduct[]>('productos', { method: 'POST', body: productToRow(input, slug), prefer: 'return=representation' });
        const created = rows[0];
        await syncVariants(created.id, input.variantes || []);
        const product = await fetchProductBundle(created.id);
        return json({ ok: true, data: product! });
      }

      case 'updateProduct': {
        const input = getObject(body, 'product') as unknown as Product | null;
        if (!input?.id) return json({ ok: false, message: 'ID de producto requerido.' }, 400);
        if (!String(input.categoriaId || '').trim()) return json({ ok: false, message: 'Selecciona una categoría.' }, 400);
        const slug = await uniqueSlug('productos', input.slug || input.nombre, input.id);
        const rows = await supabaseRest<DatabaseProduct[]>('productos', { method: 'PATCH', query: { id: `eq.${input.id}` }, body: productToRow(input, slug), prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        await syncVariants(input.id, input.variantes || []);
        const product = await fetchProductBundle(input.id);
        return json({ ok: true, data: product! });
      }

      case 'deleteProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de producto requerido.' }, 400);
        const rows = await supabaseRest<DatabaseProduct[]>('productos', { method: 'PATCH', query: { id: `eq.${id}` }, body: { activo: false, estado: 'archived' }, prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        await supabaseRest('variantes_producto', { method: 'PATCH', query: { product_id: `eq.${id}` }, body: { active: false } });
        return json({ ok: true, data: null, message: 'Producto archivado. Los pedidos históricos se conservaron intactos.' });
      }

      case 'createOrder': {
        const order = getObject(body, 'order') as unknown as OrderPayload | null;
        if (!order || !String(order.cliente || '').trim() || !String(order.telefono || '').trim() || !String(order.ubicacion || '').trim() || !Array.isArray(order.items) || order.items.length === 0) {
          return json({ ok: false, message: 'Datos de pedido incompletos.' }, 400);
        }
        const items = asOrderItems(order.items);
        if (items.some((item) => (!item.productId && !item.promotionId) || item.cantidad < 1)) return json({ ok: false, message: 'El pedido contiene productos inválidos.' }, 400);

        const result = await supabaseRest<Array<{ id: string; saved: boolean }>>('rpc/crear_pedido', {
          method: 'POST',
          body: {
            p_cliente: String(order.cliente || '').trim(),
            p_telefono: String(order.telefono || '').trim(),
            p_ubicacion: String(order.ubicacion || '').trim(),
            p_items: items,
            p_email: String(order.email || '').trim(),
            p_direccion: String(order.direccion || '').trim(),
            p_metodo_entrega: String(order.metodoEntrega || '').trim() || 'Por confirmar',
            p_metodo_pago: String(order.metodoPago || '').trim() || 'Por definir con el asesor',
            p_notas: String(order.notas || '').trim(),
            p_total: Number(order.total) || 0,
            p_vendedor_codigo: String(order.vendedorCodigo || '').trim() || null,
          },
        });

        const saved = result[0];
        if (!saved?.id) return json({ ok: false, message: 'El pedido no pudo registrarse.' }, 500);
        let notificationSent = false;
        try {
          const rows = await supabaseRest<DatabaseOrder[]>('pedidos', { query: { select: '*', id: `eq.${saved.id}`, limit: '1' } });
          if (rows[0]) notificationSent = await sendAdminOrderEmail(orderFromRow(rows[0]));
        } catch (emailError) {
          console.error('Pedido guardado, pero falló la notificación:', emailError);
        }
        return json({ ok: true, data: { id: saved.id, saved: saved.saved !== false, notificationSent }, warning: notificationSent || !process.env.RESEND_API_KEY ? undefined : 'El pedido se guardó, pero no se pudo enviar el correo al administrador.' });
      }

      case 'getOrders': {
        const rows = await supabaseRest<DatabaseOrder[]>('pedidos', { query: { select: '*', order: 'fecha.desc' } });
        return json({ ok: true, data: rows.map(orderFromRow) });
      }

      case 'updateOrderStatus': {
        const id = String(body.id || '').trim();
        const estado = String(body.estado || '').trim();
        if (!id || !estado) return json({ ok: false, message: 'ID y estado son obligatorios.' }, 400);
        if (!VALID_ORDER_STATUSES.has(estado)) return json({ ok: false, message: 'Estado de pedido no válido.' }, 400);
        const rows = await supabaseRest<DatabaseOrder[]>('pedidos', { method: 'PATCH', query: { id: `eq.${id}` }, body: { estado }, prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Pedido no encontrado.' }, 404);
        return json({ ok: true, data: orderFromRow(rows[0]) });
      }

      case 'getPromotions': {
        const query: Record<string, string> = { select: '*', order: 'destacado.desc,created_at.desc' };
        if (!isAdmin) query.activo = 'eq.true';
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', { query });
        return json({ ok: true, data: rows.map(promotionFromRow) });
      }

      case 'addPromotion': {
        const input = getObject(body, 'promotion') as unknown as Omit<Promotion, 'id'> | null;
        if (!input || !String(input.titulo || '').trim() || input.precio === undefined) return json({ ok: false, message: 'Datos de la promoción incompletos.' }, 400);
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', { method: 'POST', body: promotionToRow(input), prefer: 'return=representation' });
        return json({ ok: true, data: promotionFromRow(rows[0]) });
      }

      case 'updatePromotion': {
        const input = getObject(body, 'promotion') as unknown as Promotion | null;
        if (!input?.id) return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', { method: 'PATCH', query: { id: `eq.${input.id}` }, body: promotionToRow(input), prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Promoción no encontrada.' }, 404);
        return json({ ok: true, data: promotionFromRow(rows[0]) });
      }

      case 'deletePromotion': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        await supabaseRest('promociones', { method: 'DELETE', query: { id: `eq.${id}` } });
        return json({ ok: true, data: null });
      }

      case 'getConfig': {
        const rows = await supabaseRest<Array<{ clave: string; valor: unknown }>>('configuracion', { query: { select: 'clave,valor', clave: 'eq.TasaBs', limit: '1' } });
        return json<StoreConfig>({ ok: true, data: { tasaBs: Number(rows[0]?.valor) || 0 } });
      }

      case 'updateConfig': {
        const config = getObject(body, 'config') as unknown as StoreConfig | null;
        const tasaBs = Number(config?.tasaBs);
        if (!Number.isFinite(tasaBs) || tasaBs < 0) return json({ ok: false, message: 'La tasa debe ser un número igual o mayor que cero.' }, 400);
        await supabaseRest('configuracion', { method: 'PATCH', query: { clave: 'eq.TasaBs' }, body: { valor: tasaBs } });
        return json<StoreConfig>({ ok: true, data: { tasaBs } });
      }

      case 'getSellers': {
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', { query: { select: '*', order: 'activo.desc,nombre.asc' } });
        return json({ ok: true, data: rows.map(sellerFromRow) });
      }

      case 'addSeller': {
        const input = getObject(body, 'seller');
        const nombre = String(input?.nombre || '').trim();
        if (!nombre) return json({ ok: false, message: 'El nombre del vendedor es obligatorio.' }, 400);
        const codigo = await createUniqueSellerCode(nombre, input?.codigo);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', { method: 'POST', body: { nombre, codigo, activo: input?.activo === undefined ? true : Boolean(input.activo) }, prefer: 'return=representation' });
        return json({ ok: true, data: sellerFromRow(rows[0]) });
      }

      case 'updateSeller': {
        const input = getObject(body, 'seller');
        const id = String(input?.id || '').trim();
        const nombre = String(input?.nombre || '').trim();
        if (!id || !nombre) return json({ ok: false, message: 'ID y nombre del vendedor son obligatorios.' }, 400);
        const codigo = await createUniqueSellerCode(nombre, input?.codigo, id);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', { method: 'PATCH', query: { id: `eq.${id}` }, body: { nombre, codigo, activo: input?.activo === undefined ? true : Boolean(input.activo) }, prefer: 'return=representation' });
        if (!rows[0]) return json({ ok: false, message: 'Vendedor no encontrado.' }, 404);
        return json({ ok: true, data: sellerFromRow(rows[0]) });
      }

      default:
        return json({ ok: false, message: 'Acción no reconocida.' }, 400);
    }
  } catch (error) {
    console.error('Error de GutiStore API:', error);
    return json({ ok: false, message: error instanceof Error ? error.message : 'No se pudo completar la operación.' }, 500);
  }
}
