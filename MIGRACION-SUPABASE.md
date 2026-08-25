# GutiSupplements conectado a Supabase

Este proyecto ya no utiliza Google Sheets ni Google Apps Script como base de datos.
Todas las lecturas y escrituras pasan por rutas internas de Next.js alojadas en Vercel,
y esas rutas se conectan con las tablas de Supabase.

## Variables que debes crear en Vercel

Abre tu proyecto en Vercel y entra en:

**Settings → Environment Variables**

Crea estas cuatro variables para Production, Preview y Development:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

### SUPABASE_URL

En Supabase abre el proyecto y copia la URL del proyecto. Tiene esta forma:

```text
https://xxxxxxxxxxxxxxxxxxxx.supabase.co
```

### SUPABASE_SECRET_KEY

En Supabase entra en **Project Settings → API Keys** y copia una clave secreta con
formato `sb_secret_...`.

Si tu proyecto todavía muestra solamente las claves antiguas, puedes usar la clave
`service_role` con el nombre de variable `SUPABASE_SERVICE_ROLE_KEY`. No necesitas
crear ambas.

Esta clave nunca debe tener el prefijo `NEXT_PUBLIC_`, nunca debe pegarse en código y
nunca debe subirse a GitHub.

### ADMIN_PASSWORD

Es la contraseña que utilizarás para entrar en:

```text
https://tu-dominio.com/admin
```

### ADMIN_SESSION_SECRET

Coloca una cadena larga y aleatoria, diferente de la contraseña. Ejemplo de formato:

```text
7f1d96d392dc4ed1b58d9bc807a8342933176246e56c481c
```

No copies exactamente el ejemplo: crea tu propia cadena.

## Despliegue

1. Sustituye el contenido del repositorio de GitHub por el contenido de este proyecto.
2. Haz commit y push a la rama conectada con Vercel.
3. Configura las cuatro variables indicadas arriba.
4. En Vercel abre **Deployments** y presiona **Redeploy** en el despliegue más reciente.
5. Abre la tienda y comprueba que aparecen los 15 productos de Supabase.
6. Entra en `/admin` y comprueba pedidos, vendedores, productos y promociones.
7. Realiza un pedido de prueba y confirma en Supabase que aparece en `public.pedidos`.

## Variables antiguas que debes eliminar de Vercel

Ya no se usan:

```text
NEXT_PUBLIC_GAS_URL
NEXT_PUBLIC_ADMIN_TOKEN
NEXT_PUBLIC_ADMIN_PASSWORD
```

El Google Apps Script anterior puede dejar de desplegarse después de comprobar que el
nuevo sitio funciona correctamente.

## Qué archivo hace cada cosa

- `lib/api.ts`: mantiene las funciones utilizadas por la interfaz, pero llama a la API interna de Next.js.
- `app/api/store/route.ts`: lee y escribe productos, promociones, pedidos, vendedores y configuración en Supabase.
- `app/api/admin/session/route.ts`: valida la contraseña del panel en el servidor y crea una cookie segura.
- `lib/supabase-rest.ts`: conexión privada entre Vercel y la REST API de Supabase.
- `lib/admin-auth.ts`: firma y comprueba la sesión administrativa.

## Pruebas recomendadas

- La página principal carga productos y promociones.
- La página individual de cada producto abre correctamente.
- La tasa en bolívares se lee desde `configuracion`.
- Un pedido nuevo se guarda en `pedidos`.
- El código `?ref=CODIGO` relaciona el pedido con un vendedor activo.
- `/admin` permite crear, editar y eliminar productos y promociones.
- `/admin` permite crear o desactivar vendedores.
- `/admin` permite cambiar el estado de los pedidos.
