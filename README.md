# GutiStore

Tienda online de ropa deportiva, calzado, lentes, accesorios, hidratación y suplementos.

- **Next.js 14 + React + TypeScript**, desplegada en **Vercel**.
- **Supabase** como base de datos (a través de la API interna `/api/store`; las claves nunca llegan al navegador).
- Carrito persistente, variantes (color / talla / opción), control de stock, checkout con confirmación por asesor, vendedores con `?ref=CODIGO`, precios en USD con equivalente en Bs y panel administrativo en `/admin`.

---

## 1. Antes de subir esta versión: ejecuta la migración en Supabase (una sola vez)

Esta versión agrega columnas y funciones nuevas. **No borra nada**: tus productos, pedidos, vendedores y promociones se conservan.

1. Entra en [supabase.com](https://supabase.com) y abre tu proyecto.
2. En el menú de la izquierda, haz clic en **SQL Editor**.
3. Pulsa **New query**.
4. Abre el archivo `supabase/migrations/20260927000000_expand_gutistore_ecommerce.sql` de este proyecto, copia **todo** su contenido y pégalo en el editor.
5. Pulsa **Run** (abajo a la derecha). Debe terminar sin errores en rojo.

Qué cambia en tus datos:

- Tus productos actuales pasan a la categoría **Suplementos** y su categoría anterior (Proteína, Rendimiento…) queda como **subcategoría**.
- Cada producto recibe una URL amigable (por ejemplo `/producto/whey-protein-isolate-2-lb`). Los enlaces viejos con el id siguen funcionando y redirigen a la nueva URL.
- Se crea la tabla `tienda_categorias` para administrar categorías y subcategorías desde el panel.
- Los pedidos nuevos descuentan inventario automáticamente; si cancelas un pedido, el stock vuelve solo.

> Puedes ejecutar el script más de una vez sin problema. Si por algún motivo la tienda se publica antes de ejecutarlo, sigue funcionando como antes (sin variantes ni control de stock) hasta que lo ejecutes.

## 2. Subir el código a GitHub (Vercel publica solo)

1. Abre tu repositorio en GitHub.
2. Reemplaza el contenido por los archivos de este proyecto (puedes arrastrar la carpeta en **Add file → Upload files**, o usar GitHub Desktop).
3. Haz **Commit**. Vercel detecta el cambio y publica la nueva versión en uno o dos minutos.

No subas nunca un archivo `.env` o `.env.local` con claves.

## 3. Variables en Vercel

En **Vercel → tu proyecto → Settings → Environment Variables** deben existir (ya las tenías):

| Variable | Qué es |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) | Clave secreta de Supabase |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin` |
| `ADMIN_SESSION_SECRET` | Cadena larga y aleatoria para firmar la sesión |
| `NEXT_PUBLIC_SITE_URL` *(opcional, nueva)* | Tu dominio, por ejemplo `https://gutistore.com`. Mejora las vistas previas al compartir enlaces. |

Si agregas o cambias una variable, en **Deployments** pulsa **Redeploy**.

## 4. Cómo usar el panel (`/admin`)

- **Productos → Nuevo producto**: el formulario está dividido en secciones.
  - *Información principal*: nombre, descripciones, categoría, subcategoría, marca, etiquetas.
  - *Precio e inventario*: precio, precio anterior (se muestra tachado con el % de ahorro), SKU y stock.
  - *Imágenes*: foto principal y galería (pega la URL de cada foto).
  - *Variantes*: para ropa, calzado, lentes, botellas… Usa **Generar combinaciones** (ej.: colores `Negro #000000, Blanco` y tallas `S, M, L`) y luego ajusta stock, precio o foto de cada fila. Con variantes, el stock se controla por cada combinación.
  - *Atributos*: material, género, presentación, capacidad, especificaciones personalizadas (ej.: `Fit: Oversize`).
  - *Suplementos*: beneficios, ingredientes y modo de uso (solo se muestran si los llenas).
  - A la derecha: **Activo**, **Destacado**, **Nuevo**, **En oferta**.
- **Categorías**: crea categorías y subcategorías, cámbiales el orden o ponles imagen. Una categoría solo aparece en la tienda cuando tiene productos activos.
- **Promociones**: combos y campañas (“2 franelas por…”, “Combo Gym”). Se agregan al carrito como un producto.
- **Pedidos**: cambia el estado, contacta por WhatsApp con un mensaje listo. Cancelar devuelve el stock.
- **Vendedores**: enlaces `?ref=CODIGO` y ventas por vendedor.
- **Ajustes**: tasa USD → Bs (0 = mostrar solo USD).

## 5. Fotos

- Usa fotos nítidas; se muestran completas, sin recortes ni deformación. Las fotos con fondo blanco se integran automáticamente con el fondo de las tarjetas.
- Si quieres alojar fotos dentro del proyecto: ponlas en la carpeta `fotos-originales`, ejecuta `npm run fotos` y pega en el panel las rutas `/catalogo/...` que muestra la consola (hay que subir el proyecto a GitHub para que existan en la web).

## 6. Logo

El logo oficial está en `public/brand/`:

- `gutistore-logo-original.png`: archivo original.
- `gutistore-logo.png`: versión completa con fondo transparente (footer, login).
- `gutistore-horizontal.png`: isotipo + “GutiStore” en una línea (header).
- `gutistore-mark.png`: solo el isotipo “G”.

Todas se generaron recortando el archivo original (sin redibujar) y se muestran siempre con su proporción real.

## Desarrollo local (opcional)

```bash
cp .env.example .env.local   # y completa los valores
npm install
npm run dev
```

## Estructura

```
app/(store)/          Tienda: inicio, /tienda, /producto/[slug], /ofertas, /carrito, /checkout, /pedido/confirmado
app/admin/            Panel administrativo
app/api/store/        API interna (Supabase)
components/           Componentes (catalog, product, cart, checkout, home, admin, layout)
context/              Carrito, moneda y avisos
lib/                  Lógica de productos, variantes, catálogo, carrito y servidor
supabase/migrations/  Script SQL de la ampliación
```
