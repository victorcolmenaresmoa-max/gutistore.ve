import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from '@/lib/admin-auth';
import { supabaseRest } from '@/lib/supabase-rest';
import type {
  ApiResponse,
  OrderPayload,
  OrderRecord,
  Product,
  Promotion,
  Seller,
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
]);

const VALID_ORDER_STATUSES = new Set([
  'Pendiente',
  'Contactado',
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
]);

type DatabaseProduct = {
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function asOrderItems(value: unknown): OrderPayload['items'] {
  return Array.isArray(value) ? (value as OrderPayload['items']) : [];
}

function productFromRow(row: DatabaseProduct): Product {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    precio: Number(row.precio) || 0,
    categoria: row.categoria || 'General',
    imagen: row.imagen || '',
    imagenes: asStringArray(row.galeria),
    stock: Number(row.stock) || 0,
    presentacion: row.presentacion || '',
    beneficios: row.beneficios || '',
    modoUso: row.modo_uso || '',
    ingredientes: row.ingredientes || '',
    destacado: Boolean(row.destacado),
  };
}

function productToRow(product: Omit<Product, 'id'> | Product) {
  return {
    nombre: String(product.nombre || '').trim(),
    descripcion: String(product.descripcion || '').trim(),
    precio: Number(product.precio) || 0,
    categoria: String(product.categoria || 'General').trim() || 'General',
    imagen: String(product.imagen || '').trim(),
    galeria: asStringArray(product.imagenes),
    stock: Math.max(0, Math.trunc(Number(product.stock) || 0)),
    presentacion: String(product.presentacion || '').trim(),
    beneficios: String(product.beneficios || '').trim(),
    modo_uso: String(product.modoUso || '').trim(),
    ingredientes: String(product.ingredientes || '').trim(),
    destacado: Boolean(product.destacado),
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
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    activo: Boolean(row.activo),
    fechaCreacion: row.fecha_creacion,
  };
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

function normalizeSellerCode(value: unknown) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);
}

function sellerCodeBaseFromName(name: string) {
  return (
    normalizeSellerCode(
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
    ) || 'VENDEDOR'
  );
}

async function sellerCodeExists(code: string, excludedId?: string) {
  const query: Record<string, string> = {
    select: 'id',
    codigo: `eq.${code}`,
    limit: '1',
  };
  if (excludedId) query.id = `neq.${excludedId}`;

  const rows = await supabaseRest<Array<{ id: string }>>('vendedores', { query });
  return rows.length > 0;
}

async function createUniqueSellerCode(
  name: string,
  requestedCode: unknown,
  excludedId?: string
) {
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

function getAction(body: unknown) {
  if (!body || typeof body !== 'object' || !('action' in body)) return '';
  return String(body.action || '');
}

function getObject(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const value = (body as Record<string, unknown>)[key];
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = getAction(body);
    const isAdmin = isValidAdminSessionToken(
      request.cookies.get(ADMIN_COOKIE_NAME)?.value
    );

    if (!action) return json({ ok: false, message: 'Acción requerida.' }, 400);

    if (ADMIN_ACTIONS.has(action) && !isAdmin) {
      return json({ ok: false, message: 'Sesión administrativa no válida.' }, 401);
    }

    switch (action) {
      case 'getProducts': {
        const rows = await supabaseRest<DatabaseProduct[]>('productos', {
          query: { select: '*', order: 'nombre.asc' },
        });
        return json({ ok: true, data: rows.map(productFromRow) });
      }

      case 'getProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de producto requerido.' }, 400);

        const rows = await supabaseRest<DatabaseProduct[]>('productos', {
          query: { select: '*', id: `eq.${id}`, limit: '1' },
        });
        if (!rows[0]) {
          return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        }
        return json({ ok: true, data: productFromRow(rows[0]) });
      }

      case 'addProduct': {
        const input = getObject(body, 'product') as unknown as Omit<Product, 'id'> | null;
        if (!input || !String(input.nombre || '').trim() || input.precio === undefined) {
          return json({ ok: false, message: 'Datos de producto incompletos.' }, 400);
        }

        const rows = await supabaseRest<DatabaseProduct[]>('productos', {
          method: 'POST',
          body: productToRow(input),
          prefer: 'return=representation',
        });
        return json({ ok: true, data: productFromRow(rows[0]) });
      }

      case 'updateProduct': {
        const input = getObject(body, 'product') as unknown as Product | null;
        if (!input?.id) {
          return json({ ok: false, message: 'ID de producto requerido.' }, 400);
        }

        const rows = await supabaseRest<DatabaseProduct[]>('productos', {
          method: 'PATCH',
          query: { id: `eq.${input.id}` },
          body: productToRow(input),
          prefer: 'return=representation',
        });
        if (!rows[0]) {
          return json({ ok: false, message: 'Producto no encontrado.' }, 404);
        }
        return json({ ok: true, data: productFromRow(rows[0]) });
      }

      case 'deleteProduct': {
        const id = String(body.id || '').trim();
        if (!id) return json({ ok: false, message: 'ID de producto requerido.' }, 400);

        await supabaseRest<unknown>('productos', {
          method: 'DELETE',
          query: { id: `eq.${id}` },
        });
        return json({ ok: true, data: null });
      }

      case 'createOrder': {
        const order = getObject(body, 'order') as unknown as OrderPayload | null;
        if (
          !order ||
          !String(order.cliente || '').trim() ||
          !String(order.telefono || '').trim() ||
          !String(order.ubicacion || '').trim() ||
          !Array.isArray(order.items) ||
          order.items.length === 0
        ) {
          return json({ ok: false, message: 'Datos de pedido incompletos.' }, 400);
        }

        const result = await supabaseRest<Array<{ id: string; saved: boolean }>>(
          'rpc/crear_pedido',
          {
            method: 'POST',
            body: {
              p_cliente: String(order.cliente || '').trim(),
              p_telefono: String(order.telefono || '').trim(),
              p_ubicacion: String(order.ubicacion || '').trim(),
              p_items: order.items,
              p_email: String(order.email || '').trim(),
              p_direccion: String(order.direccion || '').trim(),
              p_metodo_entrega:
                String(order.metodoEntrega || '').trim() || 'Por confirmar',
              p_metodo_pago:
                String(order.metodoPago || '').trim() ||
                'Por definir con el asesor',
              p_notas: String(order.notas || '').trim(),
              p_total: Number(order.total) || 0,
              p_vendedor_codigo: String(order.vendedorCodigo || '').trim() || null,
            },
          }
        );

        const saved = result[0];
        return json({
          ok: true,
          data: { id: saved?.id || '', saved: saved?.saved !== false },
        });
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
        if (!id || !estado) {
          return json({ ok: false, message: 'ID y estado son obligatorios.' }, 400);
        }
        if (!VALID_ORDER_STATUSES.has(estado)) {
          return json({ ok: false, message: 'Estado de pedido no válido.' }, 400);
        }

        const rows = await supabaseRest<DatabaseOrder[]>('pedidos', {
          method: 'PATCH',
          query: { id: `eq.${id}` },
          body: { estado },
          prefer: 'return=representation',
        });
        if (!rows[0]) {
          return json({ ok: false, message: 'Pedido no encontrado.' }, 404);
        }
        return json({ ok: true, data: orderFromRow(rows[0]) });
      }

      case 'getPromotions': {
        const query: Record<string, string> = {
          select: '*',
          order: 'destacado.desc,created_at.desc',
        };
        if (!isAdmin) query.activo = 'eq.true';

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
        if (!input?.id) {
          return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        }

        const rows = await supabaseRest<DatabasePromotion[]>('promociones', {
          method: 'PATCH',
          query: { id: `eq.${input.id}` },
          body: promotionToRow(input),
          prefer: 'return=representation',
        });
        if (!rows[0]) {
          return json({ ok: false, message: 'Promoción no encontrada.' }, 404);
        }
        return json({ ok: true, data: promotionFromRow(rows[0]) });
      }

      case 'deletePromotion': {
        const id = String(body.id || '').trim();
        if (!id) {
          return json({ ok: false, message: 'ID de la promoción requerido.' }, 400);
        }

        await supabaseRest<unknown>('promociones', {
          method: 'DELETE',
          query: { id: `eq.${id}` },
        });
        return json({ ok: true, data: null });
      }

      case 'getConfig': {
        const rows = await supabaseRest<Array<{ clave: string; valor: unknown }>>(
          'configuracion',
          {
            query: { select: 'clave,valor', clave: 'eq.TasaBs', limit: '1' },
          }
        );
        const value = rows[0]?.valor;
        const tasaBs = Number(value) || 0;
        return json<StoreConfig>({ ok: true, data: { tasaBs } });
      }

      case 'updateConfig': {
        const config = getObject(body, 'config') as unknown as StoreConfig | null;
        const tasaBs = Number(config?.tasaBs);
        if (!Number.isFinite(tasaBs) || tasaBs < 0) {
          return json(
            { ok: false, message: 'La tasa debe ser un número igual o mayor que cero.' },
            400
          );
        }

        await supabaseRest<unknown>('configuracion', {
          method: 'PATCH',
          query: { clave: 'eq.TasaBs' },
          body: { valor: tasaBs },
        });
        return json<StoreConfig>({ ok: true, data: { tasaBs } });
      }

      case 'getSellers': {
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          query: { select: '*', order: 'activo.desc,nombre.asc' },
        });
        return json({ ok: true, data: rows.map(sellerFromRow) });
      }

      case 'addSeller': {
        const input = getObject(body, 'seller');
        const nombre = String(input?.nombre || '').trim();
        if (!nombre) {
          return json(
            { ok: false, message: 'El nombre del vendedor es obligatorio.' },
            400
          );
        }

        const codigo = await createUniqueSellerCode(nombre, input?.codigo);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          method: 'POST',
          body: {
            nombre,
            codigo,
            activo: input?.activo === undefined ? true : Boolean(input.activo),
          },
          prefer: 'return=representation',
        });
        return json({ ok: true, data: sellerFromRow(rows[0]) });
      }

      case 'updateSeller': {
        const input = getObject(body, 'seller');
        const id = String(input?.id || '').trim();
        const nombre = String(input?.nombre || '').trim();
        if (!id) return json({ ok: false, message: 'ID de vendedor requerido.' }, 400);
        if (!nombre) {
          return json(
            { ok: false, message: 'El nombre del vendedor es obligatorio.' },
            400
          );
        }

        const codigo = await createUniqueSellerCode(nombre, input?.codigo, id);
        const rows = await supabaseRest<DatabaseSeller[]>('vendedores', {
          method: 'PATCH',
          query: { id: `eq.${id}` },
          body: {
            nombre,
            codigo,
            activo: input?.activo === undefined ? true : Boolean(input.activo),
          },
          prefer: 'return=representation',
        });
        if (!rows[0]) {
          return json({ ok: false, message: 'Vendedor no encontrado.' }, 404);
        }
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
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo completar la operación en Supabase.',
      },
      500
    );
  }
}
