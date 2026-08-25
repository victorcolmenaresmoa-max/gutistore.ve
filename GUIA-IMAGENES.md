# Guía: fotos de botes que cargan al instante

## Por qué se veía el hueco vacío

El carrusel anterior mostraba productos del catálogo, y el catálogo llega
por `fetch` desde la API interna conectada a Supabase **después** de que la página se pinta.
La secuencia era:

```
HTML → JS descarga → React hidrata → fetch al catálogo → llegan URLs
→ recién ahí el navegador pide las fotos → las fotos vienen de Unsplash
   o de un Drive ajeno → aparecen 2-4 s tarde
```

Encima, cuando el catálogo real respondía, el carrusel cambiaba de
productos y las imágenes se recargaban desde cero: ese es el parpadeo.

`priority` no arregla esto. `priority` le dice al navegador "esta imagen
es urgente", pero solo sirve si el navegador ya sabe **cuál** es la
imagen. Si la URL depende de un fetch, no hay nada que priorizar.

**La solución es sacar el hero del camino del fetch:** un set fijo de
fotos, guardadas en tu propio proyecto, escritas directamente en el HTML.
El catálogo real sigue igual, cargándose para el resto de la página.

---

## Paso 1 — Exportar las fotos

Objetivo por foto: **menos de 40 KB**. Las nueve juntas deberían pesar
menos de 350 KB, más o menos lo que pesa una sola foto de celular.

| Qué | Valor |
|---|---|
| Formato | **WebP** (o AVIF) — nunca JPG/PNG directo del celular |
| Tamaño | **360 × 480 px** (proporción 3:4 vertical) |
| Calidad | 80–85 |
| Fondo | Blanco liso, o recortado con transparencia |
| Peso máximo | 40 KB |

Por qué 360 px: el bote se ve a unos 140 px de ancho en pantalla. 360 px
cubre pantallas Retina (2×) con margen. Subir una foto de 3000 px para
mostrarla a 140 px es el error de rendimiento más común.

### Opción A — Automático (recomendado)

```bash
npm install --save-dev sharp
mkdir fotos-originales          # pon aquí las fotos como estén
npm run fotos
```

El script deja los `.webp` listos en `public/catalogo/` y te imprime en
consola las líneas exactas para pegar en `lib/heroShowcase.ts`.

### Opción B — Manual

Con [Squoosh](https://squoosh.app) (gratis, en el navegador):
subir foto → derecha elegir **WebP** → calidad **82** → *Resize* a
**360 × 480** → Download.

---

## Paso 2 — Dónde guardarlas

```
guti-supplements/
├── public/
│   ├── catalogo/            ← AQUÍ
│   │   ├── creatina-monohidratada.webp
│   │   ├── whey-protein-isolate.webp
│   │   └── ...
│   ├── art/
│   └── guti-logo.png
```

Todo lo que está en `public/` se sirve desde la raíz del sitio. Un
archivo en `public/catalogo/creatina.webp` se pide como
`/catalogo/creatina.webp`.

**Reglas de nombre:** minúsculas, sin espacios, sin acentos, sin ñ.
`Creatina SP (1).JPG` ✗ → `creatina-sp-nutrition.webp` ✓

---

## Paso 3 — Registrarlas

Abre `lib/heroShowcase.ts` y deja una línea por bote:

```ts
{ src: '/catalogo/creatina-monohidratada.webp',
  alt: 'Creatina monohidratada micronizada',
  width: 360, height: 480 },
```

`width` y `height` son **obligatorios** y deben ser el tamaño real del
archivo. Con esos números el navegador reserva el espacio antes de tener
la foto, así que el bloque no "salta" mientras carga.

Con 9 botes quedan 3 por columna, que es lo que hace que el bucle se vea
continuo. Con menos de 6 se nota la repetición.

---

## Paso 4 — Probar

```bash
npm run build && npm start
```

Abre `localhost:3000`, ve a DevTools → **Network**, activa *Disable cache*
y elige **Slow 4G** en el selector de velocidad. Recarga.

Qué deberías ver:

- Los `.webp` del hero salen entre las **primeras** peticiones, junto al
  HTML — no después del `fetch` al catálogo.
- En **Elements**, dentro de `<head>`, hay tres
  `<link rel="preload" as="image">` (uno por columna).
- El área del carrusel nunca queda en blanco: los tiles se dibujan
  primero y las fotos aparecen dentro.

Si en Network ves las fotos disparándose *después* de la llamada a
`/api/store`, el catálogo dinámico sigue cargándose correctamente desde Supabase.

---

## Notas

- **Cambiar una foto ya publicada:** cámbiale el nombre
  (`creatina-v2.webp`). El `next.config.js` las cachea un año, así que
  reemplazar el archivo con el mismo nombre puede dejar la vieja en el
  navegador de tus clientes.
- **`priority` no va en todas:** solo la primera de cada columna. Si
  marcas las nueve, el navegador las trata a todas como urgentes y
  ninguna lo es de verdad.
- **`fotos-originales/`** no hace falta subirla al repo. Agrégala al
  `.gitignore` si prefieres.
