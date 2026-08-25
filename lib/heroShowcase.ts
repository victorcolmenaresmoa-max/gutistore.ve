/**
 * ============================================================
 *  VITRINA DEL HERO  (carrusel infinito de botes)
 * ============================================================
 *
 *  Esta lista es INTENCIONALMENTE estática y local.
 *
 *  ¿Por qué no se lee del catálogo (Google Sheets / API)?
 *  Porque el catálogo llega por fetch DESPUÉS de que la página
 *  se pinta. Mientras llega, el navegador ni siquiera sabe qué
 *  imágenes pedir → hueco vacío y parpadeo al entrar.
 *
 *  Al ser rutas locales fijas, las etiquetas <img> ya vienen
 *  escritas en el HTML inicial y el navegador empieza a
 *  descargarlas en el primer milisegundo. Cero espera, cero
 *  parpadeo.
 *
 *  ------------------------------------------------------------
 *  CÓMO AGREGAR O CAMBIAR UN BOTE
 *  ------------------------------------------------------------
 *  1. Guarda la foto en:  public/catalogo/
 *  2. Nombre en minúsculas, sin espacios ni acentos.
 *     Ej: creatina-sp-nutrition.webp
 *  3. Agrega una línea aquí abajo con su ruta, su texto alt y
 *     el tamaño REAL en píxeles del archivo exportado.
 *
 *  El tamaño real es obligatorio: es lo que evita que el bloque
 *  "salte" mientras la imagen carga (layout shift).
 * ============================================================
 */

export interface ShowcaseItem {
  /** Ruta dentro de /public. Siempre empieza con "/". */
  src: string;
  /** Descripción para lectores de pantalla y SEO. */
  alt: string;
  /** Ancho real del archivo exportado, en píxeles. */
  width: number;
  /** Alto real del archivo exportado, en píxeles. */
  height: number;
}

/**
 * Recomendado: entre 6 y 12 botes. Con 9 quedan 3 por columna,
 * que es la cantidad justa para que el bucle se vea continuo.
 *
 * ⚠️ Las rutas de abajo son de ejemplo. Reemplázalas por tus
 * archivos reales siguiendo la guía GUIA-IMAGENES.md.
 */
export const HERO_SHOWCASE: ShowcaseItem[] = [
  { src: '/catalogo/2026-07-26-05196acb-a2e3-4bb2-aee6-9d27ccfd6192-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-2de5f87e-790c-478c-bcbd-35b588b712e6-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-419d3e8d-10af-4bc1-a8bc-200cf9cff32f-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-45e1414c-1165-4869-8722-fa21a8326db1-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-470cc9a1-2ae2-43b5-be29-933288af796e-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-6b38f2bb-cab2-4011-9377-e49e938f4f53-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-848fde13-7202-411b-b4fa-81d8dea6af5f-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-8be0eb52-56f6-493f-b563-08985bff4876-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-bb2d5204-2e2f-4c63-8230-04db4a9a6f4c-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-cd901e10-354b-4983-9f0f-93836148b9d8-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-f5595868-8644-4289-939e-908459ace4b6-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
  { src: '/catalogo/2026-07-26-f802a04a-867f-473f-971b-889bbcc5a081-removebg-preview.webp', alt: 'Guti Supplement', width: 360, height: 480 },
];
