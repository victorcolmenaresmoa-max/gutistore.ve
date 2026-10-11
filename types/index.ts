/* ============================================================
 *  Tipos compartidos de GutiStore
 *  Todos los precios se guardan en USD.
 * ============================================================ */

/** Color con nombre visible y código hexadecimal opcional. */
export interface ColorValue {
  nombre: string;
  /** Ej.: "#000000". Si falta, la interfaz muestra una etiqueta de texto. */
  hex?: string;
}

/** Par nombre/valor usado para especificaciones técnicas y atributos personalizados. */
export interface ProductSpec {
  nombre: string;
  valor: string;
}

/**
 * Variante concreta de un producto (por ejemplo "Negro / M").
 * Cuando un producto tiene variantes, el stock y la disponibilidad dependen
 * exclusivamente de ellas.
 */
export interface ProductVariant {
  id: string;
  sku: string;
  color: ColorValue | null;
  talla: string;
  /** Valor de la opción adicional (su nombre está en Product.opcionVariante). */
  opcion: string;
  /** Precio específico en USD. null = usa el precio del producto. */
  precio: number | null;
  stock: number;
  /** Imagen específica de la variante (opcional). */
  imagen: string;
  activo: boolean;
}

export interface Product {
  id: string;
  /** Identificador SEO amigable. Puede estar vacío en productos muy antiguos. */
  slug: string;
  nombre: string;
  descripcionCorta: string;
  /** Descripción completa. */
  descripcion: string;
  precio: number;
  /** Precio anterior / compare-at. 0 = sin precio anterior. */
  precioAnterior: number;
  categoria: string;
  subcategoria: string;
  marca: string;
  sku: string;
  imagen: string;
  /** Imágenes adicionales (galería). La portada sigue siendo `imagen`. */
  imagenes: string[];
  /** Stock general. Solo se usa cuando el producto no tiene variantes. */
  stock: number;
  destacado: boolean;
  nuevo: boolean;
  oferta: boolean;
  activo: boolean;
  etiquetas: string[];
  /** Características en formato de lista. */
  caracteristicas: string[];
  /** Especificaciones y atributos personalizados. */
  especificaciones: ProductSpec[];
  material: string;
  genero: string;
  presentacion: string;
  /** Peso, volumen o capacidad. */
  capacidad: string;
  beneficios: string;
  ingredientes: string;
  modoUso: string;
  informacionAdicional: string;
  /** Nombre de la opción adicional de variantes (ej.: "Capacidad", "Sabor"). */
  opcionVariante: string;
  variantes: ProductVariant[];
  createdAt: string;
}

/** Datos que el panel envía para crear o actualizar un producto. */
export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string;
  /** id de la categoría padre cuando es una subcategoría. */
  parentId: string | null;
  orden: number;
  activo: boolean;
}

export type CategoryInput = Omit<Category, 'id' | 'slug'> & { slug?: string };

/**
 * Oferta / campaña promocional (combos, "2 camisetas por...", etc.).
 */
export interface Promotion {
  id: string;
  titulo: string;
  descripcion: string;
  /** Lista de productos incluidos, un ítem por línea. */
  productos: string;
  /** Precio promocional en USD. */
  precio: number;
  /** Precio regular en USD (opcional), para mostrar el ahorro. */
  precioRegular?: number;
  imagen: string;
  imagenes?: string[];
  activo?: boolean;
  destacado?: boolean;
}

/**
 * Configuración general de la tienda.
 */
export interface StoreConfig {
  /** Bolívares por 1 USD. Si es 0 o menor, los precios se muestran solo en USD. */
  tasaBs: number;
}

export type OrderItemType = 'producto' | 'promocion';

/**
 * Línea de un pedido. Los pedidos antiguos solo tienen id, nombre, precio y
 * cantidad; el resto de campos es opcional para mantener compatibilidad.
 */
export interface OrderItem {
  /** Id del producto o de la promoción (compatibilidad con pedidos antiguos). */
  id: string;
  productId?: string;
  tipo?: OrderItemType;
  nombre: string;
  /** Precio unitario en USD. */
  precio: number;
  cantidad: number;
  subtotal?: number;
  varianteId?: string;
  varianteNombre?: string;
  color?: string;
  talla?: string;
  opcion?: string;
  opcionNombre?: string;
  sku?: string;
  imagen?: string;
}

export interface Seller {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface OrderPayload {
  /** Campo trampa anti-bots (siempre vacío para personas). */
  website?: string;
  /** Momento en que se abrió el checkout (anti-bots). */
  startedAt?: number;
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
  /** Código de vendedor capturado desde ?ref= y validado en Supabase. */
  vendedorCodigo?: string;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  fecha: string;
  estado: string;
  vendedorId?: string;
  vendedorNombre?: string;
  /** true cuando el pedido descontó inventario al crearse. */
  controlStock?: boolean;
}

export interface CreatedOrder {
  id: string;
  saved?: boolean;
  total?: number;
  items?: OrderItem[];
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
}
