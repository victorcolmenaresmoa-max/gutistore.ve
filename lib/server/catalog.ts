import type { Category, Product } from '@/types';
import { supabaseRest } from '@/lib/supabase-rest';
import { categoryFromRow, DatabaseCategory, DatabaseProduct, productFromRow } from './mappers';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Detecta errores de PostgREST por columnas/tablas/funciones que aún no existen (migración pendiente). */
export function isMissingSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /does not exist|could not find|schema cache|PGRST20[0-9]|42703|42P01|42883/i.test(message);
}

export async function listProducts({ includeInactive = false } = {}): Promise<Product[]> {
  const rows = await supabaseRest<DatabaseProduct[]>('productos', {
    query: { select: '*', order: 'nombre.asc' },
  });
  const products = rows.map(productFromRow);
  return includeInactive ? products : products.filter((product) => product.activo);
}

/**
 * Busca un producto por slug o por id (las URLs antiguas usaban el id).
 */
export async function findProduct(slugOrId: string, { includeInactive = false } = {}): Promise<Product | null> {
  const value = slugOrId.trim();
  if (!value) return null;

  let rows: DatabaseProduct[] = [];
  try {
    rows = await supabaseRest<DatabaseProduct[]>('productos', {
      query: { select: '*', slug: `eq.${value}`, limit: '1' },
    });
  } catch (error) {
    // Si la columna slug todavía no existe, se busca solo por id.
    if (!isMissingSchemaError(error)) throw error;
  }

  if (!rows[0]) {
    const isUuid = UUID_RE.test(value);
    try {
      rows = await supabaseRest<DatabaseProduct[]>('productos', {
        query: { select: '*', id: `eq.${value}`, limit: '1' },
      });
    } catch (error) {
      // Un id no-UUID contra una columna uuid produce error: simplemente no existe.
      if (isUuid) throw error;
      rows = [];
    }
  }

  const product = rows[0] ? productFromRow(rows[0]) : null;
  if (!product) return null;
  return includeInactive || product.activo ? product : null;
}

export async function listCategories(): Promise<Category[] | null> {
  try {
    const rows = await supabaseRest<DatabaseCategory[]>('tienda_categorias', {
      query: { select: '*', order: 'orden.asc,nombre.asc' },
    });
    return rows.map(categoryFromRow);
  } catch (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
}
