import type { Product, ProductInput } from '@/types';
import { sanitizeHex } from '@/lib/colors';
import { slugify, splitLines, splitTags } from '@/lib/text';

export interface VariantDraft {
  id: string;
  colorNombre: string;
  colorHex: string;
  talla: string;
  opcion: string;
  sku: string;
  precio: string;
  stock: string;
  imagen: string;
  activo: boolean;
}

export interface SpecDraft {
  id: string;
  nombre: string;
  valor: string;
}

export interface ProductDraft {
  nombre: string;
  slug: string;
  slugTouched: boolean;
  descripcionCorta: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  etiquetas: string;
  precio: string;
  precioAnterior: string;
  sku: string;
  stock: string;
  activo: boolean;
  destacado: boolean;
  nuevo: boolean;
  oferta: boolean;
  imagen: string;
  imagenes: string[];
  material: string;
  genero: string;
  presentacion: string;
  capacidad: string;
  informacionAdicional: string;
  especificaciones: SpecDraft[];
  caracteristicas: string;
  beneficios: string;
  ingredientes: string;
  modoUso: string;
  opcionVariante: string;
  variantes: VariantDraft[];
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyVariant(partial: Partial<VariantDraft> = {}): VariantDraft {
  return {
    id: newId(),
    colorNombre: '',
    colorHex: '',
    talla: '',
    opcion: '',
    sku: '',
    precio: '',
    stock: '0',
    imagen: '',
    activo: true,
    ...partial,
  };
}

export const EMPTY_DRAFT: ProductDraft = {
  nombre: '',
  slug: '',
  slugTouched: false,
  descripcionCorta: '',
  descripcion: '',
  categoria: '',
  subcategoria: '',
  marca: '',
  etiquetas: '',
  precio: '',
  precioAnterior: '',
  sku: '',
  stock: '0',
  activo: true,
  destacado: false,
  nuevo: true,
  oferta: false,
  imagen: '',
  imagenes: [],
  material: '',
  genero: '',
  presentacion: '',
  capacidad: '',
  informacionAdicional: '',
  especificaciones: [],
  caracteristicas: '',
  beneficios: '',
  ingredientes: '',
  modoUso: '',
  opcionVariante: '',
  variantes: [],
};

export function draftFromProduct(product: Product): ProductDraft {
  return {
    nombre: product.nombre,
    slug: product.slug,
    slugTouched: true,
    descripcionCorta: product.descripcionCorta,
    descripcion: product.descripcion,
    categoria: product.categoria,
    subcategoria: product.subcategoria,
    marca: product.marca,
    etiquetas: product.etiquetas.join(', '),
    precio: String(product.precio),
    precioAnterior: product.precioAnterior > 0 ? String(product.precioAnterior) : '',
    sku: product.sku,
    stock: String(product.stock),
    activo: product.activo,
    destacado: product.destacado,
    nuevo: product.nuevo,
    oferta: product.oferta,
    imagen: product.imagen,
    imagenes: [...product.imagenes],
    material: product.material,
    genero: product.genero,
    presentacion: product.presentacion,
    capacidad: product.capacidad,
    informacionAdicional: product.informacionAdicional,
    especificaciones: product.especificaciones.map((spec) => ({ id: newId(), ...spec })),
    caracteristicas: product.caracteristicas.join('\n'),
    beneficios: product.beneficios,
    ingredientes: product.ingredientes,
    modoUso: product.modoUso,
    opcionVariante: product.opcionVariante,
    variantes: product.variantes.map((variant) => ({
      id: variant.id,
      colorNombre: variant.color?.nombre || '',
      colorHex: variant.color?.hex || '',
      talla: variant.talla,
      opcion: variant.opcion,
      sku: variant.sku,
      precio: variant.precio ? String(variant.precio) : '',
      stock: String(variant.stock),
      imagen: variant.imagen,
      activo: variant.activo,
    })),
  };
}

export type DraftErrors = Partial<Record<keyof ProductDraft | 'general', string>>;

const isNonNegativeNumber = (value: string) => value.trim() === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);
const isNonNegativeInt = (value: string) => Number.isInteger(Number(value || 0)) && Number(value || 0) >= 0;

export function validateDraft(draft: ProductDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
  if (!draft.categoria.trim()) errors.categoria = 'Elige o escribe una categoría.';
  if (!draft.precio.trim() || !isNonNegativeNumber(draft.precio)) errors.precio = 'Indica un precio válido en USD.';
  if (!isNonNegativeNumber(draft.precioAnterior)) errors.precioAnterior = 'El precio anterior debe ser un número.';
  if (draft.precioAnterior.trim() && Number(draft.precioAnterior) > 0 && Number(draft.precioAnterior) <= Number(draft.precio)) {
    errors.precioAnterior = 'El precio anterior debe ser mayor que el precio actual.';
  }
  if (!isNonNegativeInt(draft.stock)) errors.stock = 'El stock debe ser un número entero (0 o más).';

  const seen = new Set<string>();
  for (const [index, variant] of draft.variantes.entries()) {
    const row = `Variante ${index + 1}`;
    if (!variant.colorNombre.trim() && !variant.talla.trim() && !variant.opcion.trim()) {
      errors.variantes = `${row}: indica al menos color, talla u opción.`;
      break;
    }
    if (variant.colorHex.trim() && !sanitizeHex(variant.colorHex)) {
      errors.variantes = `${row}: el color hexadecimal no es válido (ej.: #000000).`;
      break;
    }
    if (!isNonNegativeInt(variant.stock)) {
      errors.variantes = `${row}: el stock debe ser un número entero.`;
      break;
    }
    if (!isNonNegativeNumber(variant.precio)) {
      errors.variantes = `${row}: el precio debe ser un número.`;
      break;
    }
    const key = [variant.colorNombre, variant.talla, variant.opcion].map((v) => v.trim().toLowerCase()).join('|');
    if (seen.has(key)) {
      errors.variantes = `${row}: esa combinación ya existe.`;
      break;
    }
    seen.add(key);
  }
  if (draft.variantes.some((variant) => variant.opcion.trim()) && !draft.opcionVariante.trim()) {
    errors.opcionVariante = 'Ponle nombre a la opción adicional (ej.: Capacidad, Sabor).';
  }
  return errors;
}

export function draftToInput(draft: ProductDraft): ProductInput {
  return {
    slug: slugify(draft.slug || draft.nombre),
    nombre: draft.nombre.trim(),
    descripcionCorta: draft.descripcionCorta.trim(),
    descripcion: draft.descripcion.trim(),
    precio: Number(draft.precio) || 0,
    precioAnterior: Number(draft.precioAnterior) || 0,
    categoria: draft.categoria.trim(),
    subcategoria: draft.subcategoria.trim(),
    marca: draft.marca.trim(),
    sku: draft.sku.trim(),
    imagen: draft.imagen.trim(),
    imagenes: draft.imagenes.map((url) => url.trim()).filter(Boolean),
    stock: Math.max(0, Math.trunc(Number(draft.stock) || 0)),
    destacado: draft.destacado,
    nuevo: draft.nuevo,
    oferta: draft.oferta,
    activo: draft.activo,
    etiquetas: splitTags(draft.etiquetas),
    caracteristicas: splitLines(draft.caracteristicas),
    especificaciones: draft.especificaciones
      .map((spec) => ({ nombre: spec.nombre.trim(), valor: spec.valor.trim() }))
      .filter((spec) => spec.nombre && spec.valor),
    material: draft.material.trim(),
    genero: draft.genero.trim(),
    presentacion: draft.presentacion.trim(),
    capacidad: draft.capacidad.trim(),
    beneficios: draft.beneficios.trim(),
    ingredientes: draft.ingredientes.trim(),
    modoUso: draft.modoUso.trim(),
    informacionAdicional: draft.informacionAdicional.trim(),
    opcionVariante: draft.opcionVariante.trim(),
    variantes: draft.variantes.map((variant) => {
      const hex = sanitizeHex(variant.colorHex);
      return {
        id: variant.id,
        sku: variant.sku.trim(),
        color: variant.colorNombre.trim() ? { nombre: variant.colorNombre.trim(), ...(hex ? { hex } : {}) } : null,
        talla: variant.talla.trim(),
        opcion: variant.opcion.trim(),
        precio: Number(variant.precio) > 0 ? Number(variant.precio) : null,
        stock: Math.max(0, Math.trunc(Number(variant.stock) || 0)),
        imagen: variant.imagen.trim(),
        activo: variant.activo,
      };
    }),
  };
}
