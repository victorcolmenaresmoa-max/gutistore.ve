import type {
  ApiResponse,
  Category,
  CategoryInput,
  CreatedOrder,
  OrderPayload,
  OrderRecord,
  Product,
  ProductInput,
  Promotion,
  Seller,
  StoreConfig,
} from '@/types';
import { normalizeProduct } from './product';

async function apiFetch<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ action, ...body }),
    });

    const payload = (await response.json()) as ApiResponse<T>;
    if (!response.ok && payload.ok !== false) {
      return { ok: false, message: `Error HTTP ${response.status}` };
    }
    return payload;
  } catch {
    return {
      ok: false,
      message: 'No se pudo conectar con la tienda. Revisa tu conexión e inténtalo de nuevo.',
    };
  }
}

function mapProducts(response: ApiResponse<Product[]>): ApiResponse<Product[]> {
  return response.ok && Array.isArray(response.data)
    ? { ...response, data: response.data.map(normalizeProduct) }
    : response;
}

function mapProduct(response: ApiResponse<Product>): ApiResponse<Product> {
  return response.ok && response.data ? { ...response, data: normalizeProduct(response.data) } : response;
}

/* ---------- Sesión administrativa ---------- */

async function sessionRequest(method: 'GET' | 'POST' | 'DELETE', body?: unknown) {
  try {
    const response = await fetch('/api/admin/session', {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
      body: body ? JSON.stringify(body) : undefined,
    });
    return (await response.json()) as ApiResponse<{ authenticated: boolean }>;
  } catch {
    return { ok: false, message: 'No se pudo comprobar la sesión administrativa.' };
  }
}

export const checkAdminSession = () => sessionRequest('GET');
export const adminLogin = (password: string) => sessionRequest('POST', { password });
export const adminLogout = () => sessionRequest('DELETE');

/* ---------- Productos ---------- */

export async function getProducts(scope: 'public' | 'admin' = 'public') {
  return mapProducts(await apiFetch<Product[]>('getProducts', { scope }));
}

export async function getProduct(id: string, scope: 'public' | 'admin' = 'public') {
  return mapProduct(await apiFetch<Product>('getProduct', { id, scope }));
}

export async function addProduct(product: ProductInput) {
  return mapProduct(await apiFetch<Product>('addProduct', { product }));
}

export async function updateProduct(product: ProductInput & { id: string }) {
  return mapProduct(await apiFetch<Product>('updateProduct', { product }));
}

export const deleteProduct = (id: string) => apiFetch<null>('deleteProduct', { id });

/* ---------- Categorías ---------- */

export const getCategories = () => apiFetch<Category[]>('getCategories');
export const addCategory = (category: CategoryInput) => apiFetch<Category>('addCategory', { category });
export const updateCategory = (category: CategoryInput & { id: string }) =>
  apiFetch<Category>('updateCategory', { category });
export const deleteCategory = (id: string) => apiFetch<null>('deleteCategory', { id });

/* ---------- Pedidos ---------- */

export const createOrder = (order: OrderPayload) => apiFetch<CreatedOrder>('createOrder', { order });
export const getOrders = () => apiFetch<OrderRecord[]>('getOrders');
export const updateOrderStatus = (id: string, estado: string) =>
  apiFetch<OrderRecord>('updateOrderStatus', { id, estado });

/* ---------- Promociones ---------- */

export const getPromotions = (scope: 'public' | 'admin' = 'public') =>
  apiFetch<Promotion[]>('getPromotions', { scope });
export const addPromotion = (promotion: Omit<Promotion, 'id'>) => apiFetch<Promotion>('addPromotion', { promotion });
export const updatePromotion = (promotion: Promotion) => apiFetch<Promotion>('updatePromotion', { promotion });
export const deletePromotion = (id: string) => apiFetch<null>('deletePromotion', { id });

/* ---------- Configuración ---------- */

export const getConfig = () => apiFetch<StoreConfig>('getConfig');
export const updateConfig = (config: StoreConfig) => apiFetch<StoreConfig>('updateConfig', { config });

/* ---------- Vendedores ---------- */

export const getSellers = () => apiFetch<Seller[]>('getSellers');
export const addSeller = (seller: Omit<Seller, 'id' | 'fechaCreacion'>) => apiFetch<Seller>('addSeller', { seller });
export const updateSeller = (seller: Seller) => apiFetch<Seller>('updateSeller', { seller });
