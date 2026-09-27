import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';
import { supabaseRest } from '@/lib/supabase-rest';
import { findProduct, isMissingSchemaError, listCategories, listProducts } from '@/lib/server/catalog';
import {
  categoryFromRow,
  categoryToRow,
  DatabaseCategory,
  DatabaseOrder,
  DatabaseProduct,
  DatabasePromotion,
  DatabaseSeller,
  desiredProductSlug,
  orderFromRow,
  orderItemsFromJson,
  productFromRow,
  productToLegacyRow,
  productToRow,
  promotionFromRow,
  promotionToRow,
  sellerFromRow,
} from '@/lib/server/mappers';
import { isValidOrderStatus } from '@/lib/orders';
import { slugify } from '@/lib/text';
import type {
  ApiResponse,
  CategoryInput,
  CreatedOrder,
  OrderItem,
  OrderPayload,
  ProductInput,
  Promotion,
  StoreConfig,
} from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ACTIONS = new Set([
  'addProduct',
  'updateProduct',
  'deleteProduct',
  'getOrders',
  'updateOrderStatus',
  'addPromotion',
  'updatePromotion',
  'deletePromotion',
  'updateConfig',
  'getSellers',
  'addSeller',
  'updateSeller',
  'addCategory',
  'updateCategory',
  'deleteCategory',
]);

const MIGRATION_HINT =
  'Ejecuta en Supabase el archivo supabase/migrations/20260927000000_expand_gutistore_ecommerce.sql para habilitar esta función.';

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

/* ---------- Slugs únicos ---------- */

async function slugTaken(resource: 'productos' | 'tienda_categorias', slug: string, excludedId?: string) {
  const query: Record<string, string> = { select: 'id', slug: `eq.${slug}`, limit: '1' };
  if (excludedId) query.id = `neq.${excludedId}`;
  const rows = await supabaseRest<Array<{ id: string }>>(resource, { query });
  return rows.length > 0;
}

async function uniqueSlug(resource: 'productos' | 'tienda_categorias', base: string, excludedId?: string) {
  const clean = slugify(base) || (resource === 'productos' ? 'producto' : 'categoria');
  let candidate = clean;
  let suffix = 2;
  while (await slugTaken(resource, candidate, excludedId)) {
    candidate = `${clean.slice(0, 72)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/* ---------- Productos ---------- */

async function saveProduct(input: ProductInput, id?: string) {
  const method = id ? 'PATCH' : 'POST';
  const query = id ? { id: `eq.${id}` } : undefined;
  try {
    const slug = await uniqueSlug('productos', desiredProductSlug(input), id);
    return await supabaseRest<DatabaseProduct[]>('productos', {
      method,
      query,
      body: productToRow(input, slug),
      prefer: 'return=representation',
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    // Migración pendiente: se guardan solo los campos originales.
    const hasAdvancedData =
      input.variantes.length > 0 || input.marca || input.subcategoria || input.precioAnterior > 0;
    const rows = await supabaseRest<DatabaseProduct[]>('productos', {
      method,
      query,
      body: productToLegacyRow(input),
      prefer: 'return=representation',
    });
    if (hasAdvancedData) {
      throw new Error(`El producto se guardó sin variantes ni campos nuevos. ${MIGRATION_HINT}`);
    }
    return rows;
  }
}

/* ---------- Seller codes ---------- */

function normalizeSellerCode(value: unknown) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);
}

function sellerCodeBaseFromName(name: string) {
  return (
    normalizeSellerCode(name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')) || 'VENDEDOR'
  );
}

async function sellerCodeExists(code: string, excludedId?: string) {
  const query: Record<string, string> = { select: 'id', codigo: `eq.${code}`, limit: '1' };
  if (excludedId) query.id = `neq.${excludedId}`;
  const rows = await supabaseRest<Array<{ id: string }>>('vendedores', { query });
  return rows.length > 0;
}

async function createUniqueSellerCode(name: string, requestedCode: unknown, excludedId?: string) {
  const requested = normalizeSellerCode(requestedCode);
  const base = requested || sellerCodeBaseFromName(name);
  let candidate = base;
  let suffix = 2;
  while (await sellerCodeExists(candidate, excludedId)) {
    candidate = `${base.slice(0, 35)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/* ---------- Pedidos ---------- */

function sanitizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];
  return orderItemsFromJson(items)
    .filter((item) => (item.productId || item.id) && item.cantidad > 0)
    .slice(0, 60)
    .map((item) => ({ ...item, cantidad: Math.min(999, item.cantidad) }));
}

async function createOrderLegacy(order: OrderPayload, rawItems: OrderItem[]) {
  // Sin la migración no hay control de stock, pero los precios se toman de la base de datos.
  const productIds = rawItems.filter((item) => item.tipo !== 'promocion').map((item) => item.productId || item.id);
  const promoIds = rawItems.filter((item) => item.tipo === 'promocion').map((item) => item.productId || item.id);
  const inList = (ids: string[]) => `in.(${ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',')})`;
  const [productRows, promoRows] = await Promise.all([
    productIds.length ? supabaseRest<DatabaseProduct[]>('productos', { query: { select: '*', id: inList(productIds) } }) : [],
    promoIds.length ? supabaseRest<DatabasePromotion[]>('promociones', { query: { select: '*', id: inList(promoIds) } }) : [],
  ]);
  const items = rawItems.map((item) => {
    const id = item.productId || item.id;
    const source =
      item.tipo === 'promocion'
        ? promoRows.find((row) => String(row.id) === id)
        : productRows.find((row) => String(row.id) === id);
    if (!source) throw new Error(`"${item.nombre}" ya no está disponible.`);
    const precio = Number(source.precio) || 0;
    const nombre = 'titulo' in source ? source.titulo : source.nombre;
    return { ...item, nombre, precio, subtotal: Math.round(precio * item.cantidad * 100) / 100 };
  });
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const result = await supabaseRest<Array<{ id: string; saved: boolean }>>('rpc/crear_pedido', {
    method: 'POST',
    body: {
      p_cliente: order.cliente,
      p_telefono: order.telefono,
      p_ubicacion: order.ubicacion,
      p_items: items,
      p_email: order.email,
      p_direccion: order.direccion,
      p_metodo_entrega: order.metodoEntrega,
      p_metodo_pago: order.metodoPago,
      p_notas: order.notas,
      p_total: Math.round(total * 100) / 100,
      p_vendedor_codigo: order.vendedorCodigo || null,
    },
  });
  const saved = Array.isArray(result) ? result[0] : (result as unknown as { id: string; saved: boolean });
  return { id: String(saved?.id || ''), saved: saved?.saved !== false, total, items };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = getAction(body);
    const isAdmin = isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

    if (!action) return json({ ok: false, message: 'Acción requerida.' }, 400);

    if (ADMIN_ACTIONS.has(action) && !isAdmin) {
      return json({ ok: false, message: 'Sesión administrativa no válida.' }, 401);
    }

    switch (action) {
      /* ================= Productos ================= */
      case 'getProducts': {
        const includeInactive = isAdmin && body.scope === 'admin';
        return json({ ok: true, data: await listProducts({ includeInactive }) });
      }

      case 'getProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'Producto requerido.' }, 400);
        const product = await findProduct(id, { includeInactive: isAdmin && body.scope === 'admin' });
        // 200 con ok:false: "no encontrado" es un resultado esperado, no un error del servidor.
        if (!product) return json({ ok: false, message: 'Producto no encontrado.' });
        return json({ ok: true, data: product });
      }

      case 'addProduct':
      case 'updateProduct': {
        const input = getObject(body, 'product') as unknown as (ProductInput & { id?: string }) | null;
        if (!input || !String(input.nombre || '').trim() || input.precio === undefined) {
          return json({ ok: false, message: 'Datos de producto incompletos.' }, 400);
        }
        const id = action === 'updateProduct' ? String(input.id || '').trim() : undefined;
        if (action === 'updateProduct' && !id) {
          return json({ ok: false, message: 'ID de producto requerido.' }, 400);
        }
        const normalizedInput: ProductInput = {
          ...input,
          variantes: Array.isArray(input.variantes) ? input.variantes : [],
          precioAnterior: Number(input.precioAnterior) || 0,
        };
        const rows = await saveProduct(normalizedInput, id);
        if (!rows[0]) return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        return json({ ok: true, data: productFromRow(rows[0]) });
      }

      case 'deleteProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de producto requerido.' }, 400);
        await supabaseRest<unknown>('productos', { method: 'DELETE', query: { id: `eq.${id}` } });
        return json({ ok: true, data: null });
      }

      /* ================= Categorías ================= */
      case 'getCategories': {
        const categories = await listCategories();
        if (categories === null) {
          return isAdmin
            ? json({ ok: false, message: `La tabla de categorías aún no existe. ${MIGRATION_HINT}` })
            : json({ ok: true, data: [] });
        }
        return json({ ok: true, data: isAdmin ? categories : categories.filter((c) => c.activo) });
      }

      case 'addCategory':
      case 'updateCategory': {
        const input = getObject(body, 'category') as unknown as (CategoryInput & { id?: string }) | null;
        const nombre = String(input?.nombre || '').trim();
        if (!input || !nombre) return json({ ok: false, message: 'El nombre de la categoría es obligatorio.' }, 400);
        const id = action === 'updateCategory' ? String(input.id || '').trim() : undefined;
        if (action === 'updateCategory' && !id) return json({ ok: false, message: 'ID de categoría requerido.' }, 400);

        let parent: DatabaseCategory | null = null;
        if (input.parentId) {
          const parents = await supabaseRest<DatabaseCategory[]>('tienda_categorias', {
            query: { select: '*', id: `eq.${input.parentId}`, limit: '1' },
          });
          parent = parents[0] || null;
          if (!parent) return json({ ok: false, message: 'La categoría principal no existe.' }, 400);
          if (parent.id === id) return json({ ok: false, message: 'Una categoría no puede ser su propia subcategoría.' }, 400);
        }

        let previous: DatabaseCategory | null = null;
        if (id) {
          const rows = await supabaseRest<DatabaseCategory[]>('tienda_categorias', {
            query: { select: '*', id: `eq.${id}`, limit: '1' },
          });
          previous = rows[0] || null;
          if (!previous) return json({ ok: false, message: 'Categoría no encontrada.' }, 404);
        }

        const baseSlug = parent ? `${parent.slug}-${slugify(nombre)}` : slugify(input.slug || nombre);
        const slug = await uniqueSlug('tienda_categorias', baseSlug, id);
        const rows = await supabaseRest<DatabaseCategory[]>('tienda_categorias', {
          method: id ? 'PATCH' : 'POST',
          query: id ? { id: `eq.${id}` } : undefined,
          body: categoryToRow({ ...input, nombre }, slug),
          prefer: 'return=representation',
        });

        // Si se renombró, los productos se actualizan para no quedar huérfanos.
        if (previous && previous.nombre !== nombre) {
          if (!previous.parent_id) {
            await supabaseRest<unknown>('productos', {
              method: 'PATCH',
              query: { categoria: `eq.${previous.nombre}` },
              body: { categoria: nombre },
            });
          } else {
            const parentRows = await supabaseRest<DatabaseCategory[]>('tienda_categorias', {
              query: { select: '*', id: `eq.${previous.parent_id}`, limit: '1' },
            });
            if (parentRows[0]) {
              await supabaseRest<unknown>('productos', {
                method: 'PATCH',
                query: { categoria: `eq.${parentRows[0].nombre}`, subcategoria: `eq.${previous.nombre}` },
                body: { subcategoria: nombre },
              });
            }
          }
        }
        return json({ ok: true, data: categoryFromRow(rows[0]) });
      }

      case 'deleteCategory': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de categoría requerido.' }, 400);
        await supabaseRest<unknown>('tienda_categorias', { method: 'DELETE', query: { id: `eq.${id}` } });
        return json({ ok: true, data: null });
      }

      /* ================= Pedidos ================= */
      case 'createOrder': {
        const raw = getObject(body, 'order') as unknown as OrderPayload | null;
        const items = sanitizeOrderItems(raw?.items);
        const order: OrderPayload | null = raw
          ? {
              cliente: String(raw.cliente || '').trim().slice(0, 120),
              telefono: String(raw.telefono || '').trim().slice(0, 40),
              email: String(raw.email || '').trim().slice(0, 160),
              ubicacion: String(raw.ubicacion || '').trim().slice(0, 160),
              direccion: String(raw.direccion || '').trim().slice(0, 400),
              metodoEntrega: String(raw.metodoEntrega || '').trim() || 'Por confirmar',
              metodoPago: String(raw.metodoPago || '').trim() || 'Por definir con el asesor',
              notas: String(raw.notas || '').trim().slice(0, 800),
              items,
              total: 0,
              vendedorCodigo: normalizeSellerCode(raw.vendedorCodigo) || undefined,
            }
          : null;

        if (!order || !order.cliente || !order.telefono || !order.ubicacion || items.length === 0) {
          return json({ ok: false, message: 'Datos de pedido incompletos.' }, 400);
        }

        let created: CreatedOrder;
        try {
          const result = await supabaseRest<Array<{ id: string; saved: boolean; total: number; items: unknown }>>(
            'rpc/crear_pedido_gutistore',
            {
              method: 'POST',
              body: {
                p_cliente: order.cliente,
                p_telefono: order.telefono,
                p_ubicacion: order.ubicacion,
                p_items: items.map((item) => ({
                  id: item.productId || item.id,
                  productId: item.productId || item.id,
                  tipo: item.tipo || 'producto',
                  varianteId: item.varianteId || '',
                  nombre: item.nombre,
                  cantidad: item.cantidad,
                })),
                p_email: order.email,
                p_direccion: order.direccion,
                p_metodo_entrega: order.metodoEntrega,
                p_metodo_pago: order.metodoPago,
                p_notas: order.notas,
                p_vendedor_codigo: order.vendedorCodigo || null,
              },
            }
          );
          const saved = result[0];
          created = {
            id: String(saved?.id || ''),
            saved: saved?.saved !== false,
            total: Number(saved?.total) || 0,
            items: orderItemsFromJson(saved?.items),
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          // Migración pendiente: se usa el flujo original sin control de stock.
          if (isMissingSchemaError(error) && message.includes('crear_pedido_gutistore')) {
            created = await createOrderLegacy(order, items);
          } else {
            throw error;
          }
        }
        return json({ ok: true, data: created });
      }

      case 'getOrders': {
        const rows = await supabaseRest<DatabaseOrder[]>('pedidos', {
          query: { select: '*', order: 'fecha.desc' },
        });
        return json({ ok: true, data: rows.map(orderFromRow) });
      }

      case 'updateOrderStatus': {
        const id = String(body.id || '').trim();
        const estado = String(body.estado || '').trim();
        if (!id || !estado) return json({ ok: false, message: 'ID y estado son obligatorios.' }, 400);
        if (!isValidOrderStatus(estado)) return json({ ok: false, message: 'Estado de pedido no válido.' }, 400);

        try {
          await supabaseRest<boolean>('rpc/cambiar_estado_pedido', {
            method: 'POST',
            body: { p_pedido_id: id, p_estado: estado },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          if (!(isMissingSchemaError(error) && message.includes('cambiar_estado_pedido'))) throw error;
          await supabaseRest<unknown>('pedidos', {
            method: 'PATCH',
            query: { id: `eq.${id}` },
            body: { estado },
          });
        }

        const rows = await supabaseRest<DatabaseOrder[]>('pedidos', {
          query: { select: '*', id: `eq.${id}`, limit: '1' },
        });
        if (!rows[0]) return json({ ok: false, message: 'Pedido no encontrado.' }, 404);
        return json({ ok: true, data: orderFromRow(rows[0]) });
      }

      /* ================= Promociones ================= */
      case 'getPromotions': {
        const query: Record<string, string> = { select: '*', order: 'destacado.desc,created_at.desc' };
        if (!(isAdmin && body.scope === 'admin')) query.activo = 'eq.true';
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', { query });
        return json({ ok: true, data: rows.map(promotionFromRow) });
      }

      case 'addPromotion': {
        const input = getObject(body, 'promotion') as unknown as Omit<Promotion, 'id'> | null;
        if (!input || !String(input.titulo || '').trim() || input.precio === undefined) {
          return json({ ok: false, message: 'Datos de la promoción incompletos.' }, 400);
        }
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', {
          method: 'POST',
          body: promotionToRow(input),
          prefer: 'return=representation',
        });
        return json({ ok: true, data: promotionFromRow(rows[0]) });
      }

      case 'updatePromotion': {
        const input = getObject(body, 'promotion') as unknown as Promotion | null;
        if (!input?.id) return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        const rows = await supabaseRest<DatabasePromotion[]>('promociones', {
          method: 'PATCH',
          query: { id: `eq.${input.id}` },
          body: promotionToRow(input),
          prefer: 'return=representation',
        });
        if (!rows[0]) return json({ ok: false, message: 'Promoción no encontrada.' }, 404);
        return json({ ok: true, data: promotionFromRow(rows[0]) });
      }

      case 'deletePromotion': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        await supabaseRest<unknown>('promociones', { method: 'DELETE', query: { id: `eq.${id}` } });
        return json({ ok: true, data: null });
      }

      /* ================= Configuración ================= */
      case 'getConfig': {
        const rows = await supabaseRest<Array<{ clave: string; valor: unknown }>>('configuracion', {
          query: { select: 'clave,valor', clave: 'eq.TasaBs', limit: '1' },
        });
        const tasaBs = Number(rows[0]?.valor) || 0;
        return json<StoreConfig>({ ok: true, data: { tasaBs } });
      }

      case 'updateConfig': {
        const config = getObject(body, 'config') as unknown as StoreConfig | null;
        const tasaBs = Number(config?.tasaBs);
        if (!Number.isFinite(tasaBs) || tasaBs < 0) {
          return json({ ok: false, message: 'La tasa debe ser un número igual o mayor que cero.' }, 400);
        }
        const updated = await supabaseRest<unknown[]>('configuracion', {
          method: 'PATCH',
          query: { clave: 'eq.TasaBs' },
          body: { valor: tasaBs },
          prefer: 'return=representation',
        });
        if (!Array.isArray(updated) || updated.length === 0) {
          await supabaseRest<unknown>('configuracion', {
            method: 'POST',
            body: { clave: 'TasaBs', valor: tasaBs },
          });
        }
        return json<StoreConfig>({ ok: true, data: { tasaBs } });
      }

      /* ================= Vendedores ================= */
      case 'getSellers': {
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          query: { select: '*', order: 'activo.desc,nombre.asc' },
        });
        return json({ ok: true, data: rows.map(sellerFromRow) });
      }

      case 'addSeller': {
        const input = getObject(body, 'seller');
        const nombre = String(input?.nombre || '').trim();
        if (!nombre) return json({ ok: false, message: 'El nombre del vendedor es obligatorio.' }, 400);
        const codigo = await createUniqueSellerCode(nombre, input?.codigo);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          method: 'POST',
          body: { nombre, codigo, activo: input?.activo === undefined ? true : Boolean(input.activo) },
          prefer: 'return=representation',
        });
        return json({ ok: true, data: sellerFromRow(rows[0]) });
      }

      case 'updateSeller': {
        const input = getObject(body, 'seller');
        const id = String(input?.id || '').trim();
        const nombre = String(input?.nombre || '').trim();
        if (!id) return json({ ok: false, message: 'ID de vendedor requerido.' }, 400);
        if (!nombre) return json({ ok: false, message: 'El nombre del vendedor es obligatorio.' }, 400);
        const codigo = await createUniqueSellerCode(nombre, input?.codigo, id);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          method: 'PATCH',
          query: { id: `eq.${id}` },
          body: { nombre, codigo, activo: input?.activo === undefined ? true : Boolean(input.activo) },
          prefer: 'return=representation',
        });
        if (!rows[0]) return json({ ok: false, message: 'Vendedor no encontrado.' }, 404);
        return json({ ok: true, data: sellerFromRow(rows[0]) });
      }

      default:
        return json({ ok: false, message: 'Acción no reconocida.' }, 400);
    }
  } catch (error) {
    console.error('Error de Supabase:', error);
    return json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo completar la operación en Supabase.',
      },
      500
    );
  }
}
