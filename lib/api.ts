import {
  ApiResponse,
  OrderPayload,
  OrderRecord,
  Product,
  Promotion,
  Seller,
  StoreConfig,
} from '@/types';

async function apiFetch<T>(
  action: string,
  body: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
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
  } catch (error) {
    console.error('Error al llamar a la API interna:', error);
    return {
      ok: false,
      message:
        'No se pudo conectar con el servidor de la tienda. Verifica la conexión y las variables de Supabase en Vercel.',
    };
  }
}

export async function checkAdminSession(): Promise<
  ApiResponse<{ authenticated: boolean }>
> {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return (await response.json()) as ApiResponse<{ authenticated: boolean }>;
  } catch {
    return { ok: false, message: 'No se pudo comprobar la sesión administrativa.' };
  }
}

export async function adminLogin(
  password: string
): Promise<ApiResponse<{ authenticated: boolean }>> {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });
    return (await response.json()) as ApiResponse<{ authenticated: boolean }>;
  } catch {
    return { ok: false, message: 'No se pudo iniciar sesión.' };
  }
}

export async function adminLogout(): Promise<ApiResponse<{ authenticated: boolean }>> {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    return (await response.json()) as ApiResponse<{ authenticated: boolean }>;
  } catch {
    return { ok: false, message: 'No se pudo cerrar la sesión.' };
  }
}

export async function getProducts(): Promise<ApiResponse<Product[]>> {
  return apiFetch<Product[]>('getProducts');
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return apiFetch<Product>('getProduct', { id });
}

export async function addProduct(
  product: Omit<Product, 'id'>
): Promise<ApiResponse<Product>> {
  return apiFetch<Product>('addProduct', { product });
}

export async function updateProduct(
  product: Product
): Promise<ApiResponse<Product>> {
  return apiFetch<Product>('updateProduct', { product });
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  return apiFetch<null>('deleteProduct', { id });
}

export async function createOrder(
  order: OrderPayload
): Promise<ApiResponse<{ id: string; saved?: boolean }>> {
  return apiFetch<{ id: string; saved?: boolean }>('createOrder', { order });
}

export async function getOrders(): Promise<ApiResponse<OrderRecord[]>> {
  return apiFetch<OrderRecord[]>('getOrders');
}

export async function updateOrderStatus(
  id: string,
  estado: string
): Promise<ApiResponse<OrderRecord>> {
  return apiFetch<OrderRecord>('updateOrderStatus', { id, estado });
}

export async function getPromotions(): Promise<ApiResponse<Promotion[]>> {
  return apiFetch<Promotion[]>('getPromotions');
}

export async function addPromotion(
  promotion: Omit<Promotion, 'id'>
): Promise<ApiResponse<Promotion>> {
  return apiFetch<Promotion>('addPromotion', { promotion });
}

export async function updatePromotion(
  promotion: Promotion
): Promise<ApiResponse<Promotion>> {
  return apiFetch<Promotion>('updatePromotion', { promotion });
}

export async function deletePromotion(id: string): Promise<ApiResponse<null>> {
  return apiFetch<null>('deletePromotion', { id });
}

export async function getConfig(): Promise<ApiResponse<StoreConfig>> {
  return apiFetch<StoreConfig>('getConfig');
}

export async function updateConfig(
  config: StoreConfig
): Promise<ApiResponse<StoreConfig>> {
  return apiFetch<StoreConfig>('updateConfig', { config });
}

export async function getSellers(): Promise<ApiResponse<Seller[]>> {
  return apiFetch<Seller[]>('getSellers');
}

export async function addSeller(
  seller: Omit<Seller, 'id' | 'fechaCreacion'>
): Promise<ApiResponse<Seller>> {
  return apiFetch<Seller>('addSeller', { seller });
}

export async function updateSeller(
  seller: Seller
): Promise<ApiResponse<Seller>> {
  return apiFetch<Seller>('updateSeller', { seller });
}
