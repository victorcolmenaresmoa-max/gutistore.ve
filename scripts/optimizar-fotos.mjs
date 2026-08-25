/**
 * Convierte las fotos originales de los botes al formato y tamaño
 * exactos que necesita el carrusel del hero.
 *
 * USO
 * ---
 *   1) npm install --save-dev sharp
 *   2) Pon tus fotos originales (JPG/PNG, como salgan del celular
 *      o del proveedor) en la carpeta:  fotos-originales/
 *   3) node scripts/optimizar-fotos.mjs
 *
 * Resultado: archivos .webp listos en  public/catalogo/
 *
 * El script NO toca tus originales. Puedes correrlo las veces que
 * quieras. La carpeta fotos-originales/ no hace falta subirla a
 * producción (agrégala al .gitignore si prefieres).
 */

import { readdir, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const ORIGEN = 'fotos-originales';
const DESTINO = join('public', 'catalogo');

// Tamaño de salida. El bote se muestra a ~140 px de ancho, así que
// 360 px cubre pantallas Retina (2x) con margen de sobra.
const ANCHO = 360;
const ALTO = 480;

// Pon `true` si tus fotos tienen el fondo recortado (PNG con
// transparencia) y quieres conservarlo.
const CONSERVAR_TRANSPARENCIA = true;

const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

// "Creatina SP Nutrition (1).JPG" -> "creatina-sp-nutrition-1"
function limpiarNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await mkdir(DESTINO, { recursive: true });

  let archivos;
  try {
    archivos = await readdir(ORIGEN);
  } catch {
    console.error(`\nNo encontré la carpeta "${ORIGEN}/". Créala y pon ahí tus fotos.\n`);
    process.exit(1);
  }

  const fotos = archivos.filter((f) => EXTENSIONES.has(parse(f).ext.toLowerCase()));

  if (fotos.length === 0) {
    console.error(`\nLa carpeta "${ORIGEN}/" está vacía o no tiene imágenes.\n`);
    process.exit(1);
  }

  console.log(`\nProcesando ${fotos.length} foto(s)...\n`);
  const lineas = [];

  for (const foto of fotos) {
    const salida = `${limpiarNombre(parse(foto).name)}.webp`;
    const rutaSalida = join(DESTINO, salida);

    const info = await sharp(join(ORIGEN, foto))
      .resize(ANCHO, ALTO, {
        fit: 'contain',
        background: CONSERVAR_TRANSPARENCIA
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .webp({ quality: 82, effort: 6 })
      .toFile(rutaSalida);

    const kb = (info.size / 1024).toFixed(1);
    const aviso = info.size > 45 * 1024 ? '  ← pesa de más, baja la calidad a 75' : '';
    console.log(`  ${foto}  →  ${salida}  (${kb} KB)${aviso}`);

    lineas.push(
      `  { src: '/catalogo/${salida}', alt: 'DESCRIBE EL PRODUCTO AQUÍ', width: ${ANCHO}, height: ${ALTO} },`
    );
  }

  console.log('\n------------------------------------------------------------');
  console.log('Copia esto dentro de HERO_SHOWCASE en lib/heroShowcase.ts');
  console.log('(y reemplaza el texto alt por el nombre real del producto):\n');
  console.log(lineas.join('\n'));
  console.log('\n------------------------------------------------------------\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
