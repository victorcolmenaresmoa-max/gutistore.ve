export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  id?: string;
  productId?: string;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  stock: number;
  image?: string;
  active: boolean;
  attributes: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  descripcionCorta?: string;
  precio: number;
  precioAnterior?: number | null;
  categoria: string;
  categoriaId?: string;
  categoriaSlug?: string;
  marca?: string;
  sku?: string;
  imagen: string;
  /** Imágenes adicionales. `imagen` continúa siendo la portada. */
  imagenes?: string[];
  stock: number;
  estado?: ProductStatus;
  activo?: boolean;
  destacado?: boolean;
  promocionActiva?: boolean;
  atributos?: ProductAttribute[];
  variantes?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
  /** Campos heredados de la versión anterior, conservados para no perder datos históricos. */
  presentacion?: string;
  beneficios?: string;
  modoUso?: string;
  ingredientes?: string;
}

/** Oferta / combo promocional. Se conserva para compatibilidad con la tienda existente. */
export interface Promotion {
  id: string;
  titulo: string;
  descripcion: string;
  productos: string;
  precio: number;
  precioRegular?: number;
  imagen: string;
  imagenes?: string[];
  activo?: boolean;
  destacado?: boolean;
}

export interface StoreConfig {
  /** Bolívares por 1 USD. 0 = mostrar solamente USD. */
  tasaBs: number;
}

export interface CartItem {
  key: string;
  productId: string;
  promotionId?: string;
  variantId?: string;
  nombre: string;
  slug?: string;
  imagen?: string;
  sku?: string;
  precio: number;
  cantidad: number;
  stockDisponible?: number;
  atributosSeleccionados?: Record<string, string>;
}

/** Snapshot persistido en el pedido. No depende del estado futuro del producto. */
export interface OrderItem {
  id: string;
  productId?: string;
  promotionId?: string;
  variantId?: string;
  nombre: string;
  sku?: string;
  imagen?: string;
  atributos?: Record<string, string>;
  variante?: string;
  precio: number;
  cantidad: number;
  subtotal?: number;
}

export interface Seller {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface OrderPayload {
  cliente: string;
  telefono: string;
  email: string;
  ubicacion: string;
  direccion: string;
  metodoEntrega: string;
  metodoPago: string;
  notas: string;
  items: OrderItem[];
  total: number;
  vendedorCodigo?: string;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  fecha: string;
  estado: string;
  vendedorId?: string;
  vendedorNombre?: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  warning?: string;
}
