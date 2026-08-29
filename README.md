# GutiStore

GutiStore es la evolución multirubro de la tienda original: catálogo dinámico, categorías administrables, productos con atributos y variantes, carrito persistente, checkout con snapshots históricos, inventario por variante, gestión de imágenes en Supabase Storage, referidos de vendedores y notificaciones de nuevos pedidos por email.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript.
- Supabase PostgreSQL vía REST/RPC del lado servidor.
- Supabase Storage para imágenes subidas desde el panel.
- Resend para el correo automático de nuevos pedidos.
- Deploy preparado para Vercel y Node.js 24.x.

## 1. Instalar y ejecutar

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. El panel administrativo está en `/admin`.

## 2. Base de datos y migración

Antes de desplegar esta versión sobre una base existente, ejecuta en **Supabase > SQL Editor** el archivo:

```text
supabase/migrations/20260829_gutistore_multirubro.sql
```

También existe `supabase/setup.sql` con el mismo contenido para una instalación manual rápida.

La migración es no destructiva: conserva productos, pedidos y vendedores; crea la categoría **Suplementos** y asigna ahí los productos existentes que todavía no tengan categoría dinámica. Agrega campos generales de producto, atributos JSON, tabla de variantes, índices, bucket de imágenes y actualiza la función transaccional `crear_pedido`.

No borres pedidos históricos ni variantes ya utilizadas: el pedido guarda un snapshot de nombre, SKU, variante/atributos, precio, cantidad y subtotal.

## 3. Variables de entorno

Copia `.env.example` y configura:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=guti-store-media
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
EMAIL_FROM=
```

### Supabase

Usa `SUPABASE_SECRET_KEY` con la clave privada `sb_secret_...` recomendada. `SUPABASE_SERVICE_ROLE_KEY` queda solamente como compatibilidad con proyectos que aún usan la clave legacy. Nunca publiques ninguna de estas claves con prefijo `NEXT_PUBLIC_`.

### Storage

La migración crea el bucket público `guti-store-media`. El panel `/admin` permite subir, previsualizar, reordenar, reemplazar y borrar imágenes de categorías, productos y promociones. Los uploads admiten JPG, PNG, WebP y AVIF, hasta 12 MB por archivo y 10 archivos por operación. La tienda usa `next/image` para lazy loading, tamaños responsivos y optimización de entrega.

### Email de pedidos

Crea una cuenta/proyecto en Resend, verifica el dominio remitente y configura:

```text
RESEND_API_KEY=re_...
ADMIN_NOTIFICATION_EMAIL=pedidos@tuempresa.com
EMAIL_FROM=GutiStore <pedidos@tudominio.com>
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

El email se intenta **después** de que el pedido ya fue guardado exitosamente. Si Resend falla, el pedido no se pierde. El botón **Ver pedido** apunta a `/admin?pedido=<id>`.

## 4. Funcionalidades principales

- Home multirubro con hero, categorías destacadas dinámicas, productos destacados, promociones y productos recientes.
- `/productos` con búsqueda global y filtros dinámicos.
- `/categoria/[slug]` para navegación SEO-friendly por categoría.
- Productos generalizados con marca, SKU, descripción, precio anterior, galería y atributos flexibles.
- Variantes por combinaciones como Color/Talla, con SKU, precio, imagen, estado y stock individual.
- Carrito persistente que separa variantes del mismo producto como ítems diferentes.
- Checkout y pedidos con snapshot exacto de la compra.
- Stock validado y descontado en servidor mediante RPC transaccional.
- Referidos preservados con `?ref=CODIGO`; las atribuciones antiguas de localStorage se migran automáticamente a la nueva clave de GutiStore.
- Admin responsive para Dashboard, Pedidos, Productos, Categorías, Inventario, Promociones, Vendedores y Configuración.
- Endpoints administrativos y subida de imágenes protegidos por sesión HttpOnly firmada.
- Eliminación segura: categorías con productos no se eliminan y productos se archivan para proteger historial.
- Metadata, Open Graph, manifest, favicon/app icon y 404 actualizados a GutiStore.

## 5. Comandos de verificación

```bash
npm run lint
npm run typecheck
npm run build
```

`lint` y `typecheck` ejecutan TypeScript en modo estricto. El build de producción es el mismo que utilizará Vercel.

## 6. Deploy en Vercel

1. Ejecuta primero la migración de Supabase.
2. Sube esta raíz del proyecto a GitHub.
3. Importa el repositorio en Vercel.
4. Configura todas las variables necesarias en **Project Settings > Environment Variables**.
5. Confirma que Vercel use Node.js 24.x; el proyecto lo declara en `package.json`.
6. Deploy.
7. Abre `/admin`, inicia sesión y verifica que aparezcan la categoría Suplementos y los productos existentes.
8. Sube una imagen de prueba para validar Storage.
9. Crea un pedido de prueba para validar stock, pedido, referido y correo.

## 7. QA recomendado después de conectar producción

Prueba, en este orden: crear categoría nueva; producto simple; producto con Color/Talla; dos variantes del mismo producto en carrito; variante agotada; galería/reordenamiento; pedido + email; categoría inesperada como Perfumes sin tocar código; producto antiguo; compra con link `?ref=CODIGO`.

## Seguridad

El navegador nunca recibe las claves privadas de Supabase ni Resend. No subas `.env.local`, `.env.production` ni claves reales al repositorio. Cambia `ADMIN_PASSWORD` y usa un `ADMIN_SESSION_SECRET` aleatorio largo en producción.
