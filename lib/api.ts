import type {
  ApiResponse,
  Category,
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
      message: 'No se pudo conectar con el servidor de GutiStore. Verifica tu conexión e inténtalo nuevamente.',
    };
  }
}

export async function checkAdminSession(): Promise<ApiResponse<{ authenticated: boolean }>> {
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

export async function adminLogin(password: string): Promise<ApiResponse<{ authenticated: boolean }>> {
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

export async function getProducts(options: { categorySlug?: string; search?: string; admin?: boolean } = {}) {
  return apiFetch<Product[]>('getProducts', options);
}

export async function getProduct(idOrSlug: string) {
  return apiFetch<Product>('getProduct', { id: idOrSlug });
}

export async function addProduct(product: Omit<Product, 'id'>) {
  return apiFetch<Product>('addProduct', { product });
}

export async function updateProduct(product: Product) {
  return apiFetch<Product>('updateProduct', { product });
}

export async function deleteProduct(id: string) {
  return apiFetch<null>('deleteProduct', { id });
}

export async function getCategories(options: { admin?: boolean } = {}) {
  return apiFetch<Category[]>('getCategories', options);
}

export async function addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  return apiFetch<Category>('addCategory', { category });
}

export async function updateCategory(category: Category) {
  return apiFetch<Category>('updateCategory', { category });
}

export async function deleteCategory(id: string) {
  return apiFetch<null>('deleteCategory', { id });
}

export async function createOrder(order: OrderPayload) {
  return apiFetch<{ id: string; saved?: boolean; notificationSent?: boolean }>('createOrder', { order });
}

export async function getOrders() {
  return apiFetch<OrderRecord[]>('getOrders');
}

export async function updateOrderStatus(id: string, estado: string) {
  return apiFetch<OrderRecord>('updateOrderStatus', { id, estado });
}

export async function getPromotions() {
  return apiFetch<Promotion[]>('getPromotions');
}

export async function addPromotion(promotion: Omit<Promotion, 'id'>) {
  return apiFetch<Promotion>('addPromotion', { promotion });
}

export async function updatePromotion(promotion: Promotion) {
  return apiFetch<Promotion>('updatePromotion', { promotion });
}

export async function deletePromotion(id: string) {
  return apiFetch<null>('deletePromotion', { id });
}

export async function getConfig() {
  return apiFetch<StoreConfig>('getConfig');
}

export async function updateConfig(config: StoreConfig) {
  return apiFetch<StoreConfig>('updateConfig', { config });
}

export async function getSellers() {
  return apiFetch<Seller[]>('getSellers');
}

export async function addSeller(seller: Omit<Seller, 'id' | 'fechaCreacion'>) {
  return apiFetch<Seller>('addSeller', { seller });
}

export async function updateSeller(seller: Seller) {
  return apiFetch<Seller>('updateSeller', { seller });
}

export async function uploadMedia(files: File[], folder = 'products'): Promise<ApiResponse<{ urls: string[] }>> {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    return (await response.json()) as ApiResponse<{ urls: string[] }>;
  } catch {
    return { ok: false, message: 'No fue posible subir la imagen.' };
  }
}

export async function deleteMedia(url: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ url }),
    });
    return (await response.json()) as ApiResponse<null>;
  } catch {
    return { ok: false, message: 'No fue posible eliminar la imagen del almacenamiento.' };
  }
}
