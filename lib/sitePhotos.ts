/**
 * ============================================================
 *  FOTOS REALES DEL SITIO  (GutiSupplements)
 * ============================================================
 *
 *  Aquí se controlan TODAS las fotos reales que reemplazan a
 *  los antiguos dibujos (SVG) del sitio. Para cambiar una foto,
 *  solo pega otra URL en el lugar correspondiente. No hace falta
 *  tocar nada más.
 *
 *  Cada slot tiene:
 *    - photo:    la URL de la foto real (la que se muestra).
 *    - fallback: el dibujo SVG original, que aparece solo si la
 *                foto no carga (así la página nunca se rompe).
 *
 *  NOTA: las fotos se cargan desde su URL externa. Si prefieres
 *  alojarlas tú mismo, sube los archivos a /public/photos/ y
 *  cambia la URL por, por ejemplo, "/photos/hero.jpg".
 * ============================================================
 */

import type { SyntheticEvent } from 'react';

export type Photo = { photo: string; fallback: string };

// URLs de ejemplo proporcionadas. Reemplázalas cuando quieras.
const A = 'https://cdn.phototourl.com/free/2026-07-13-4f9dd0ea-590e-4a2f-b17f-6f8078599fe4.jpg';
const B = 'https://cdn.phototourl.com/free/2026-07-13-b0bc3cc5-1db6-43f1-adba-bb8f583173fd.jpg';
const C = 'https://cdn.phototourl.com/free/2026-07-13-04ffde79-5775-4739-891c-2ba9aa5587ad.jpg';

export const SITE_PHOTOS = {
  // Foto principal del encabezado (hero).
  hero: { photo: A, fallback: '/art/hero-jar.svg' } as Photo,

  // Foto del banner "Calidad que puedes revisar".
  feature: { photo: B, fallback: '/art/feature-lab.svg' } as Photo,

  // Foto por categoría. Puedes poner una URL distinta a cada una.
  categories: {
    Proteina: { photo: C, fallback: '/art/cat-proteina.svg' } as Photo,
    Rendimiento: { photo: A, fallback: '/art/cat-rendimiento.svg' } as Photo,
    Volumen: { photo: B, fallback: '/art/cat-volumen.svg' } as Photo,
    Bienestar: { photo: C, fallback: '/art/cat-bienestar.svg' } as Photo,
  },
} as const;

/**
 * Handler para <img>: si la foto real no carga, cambia
 * automáticamente al dibujo SVG de respaldo.
 */
export function makePhotoFallback(fallback: string) {
  return (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.src = fallback;
  };
}
