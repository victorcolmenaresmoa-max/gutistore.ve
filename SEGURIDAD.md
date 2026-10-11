# Seguridad de GutiStore

Resumen de las 20 medidas de seguridad revisadas antes del lanzamiento
(octubre 2026) y dónde está cada una en el código.

## Pasos manuales pendientes (una sola vez)

1. **Supabase → SQL Editor:** ejecutar
   `supabase/migrations/20261011000000_seguridad_rls_y_fotos.sql`.
   Activa RLS en todas las tablas y prepara el bucket de fotos.
2. **Vercel → Settings → Environment Variables:** borrar, si existen,
   `NEXT_PUBLIC_ADMIN_PASSWORD`, `NEXT_PUBLIC_ADMIN_TOKEN` y
   `NEXT_PUBLIC_GAS_URL` (son de la versión antigua y ya no se usan).
   Comprobar que `ADMIN_SESSION_SECRET` sea una cadena larga y aleatoria.

## Las 20 medidas

| # | Medida | Estado |
|---|--------|--------|
| 1 | Ocultar API keys | La clave secreta de Supabase solo existe en el servidor (`lib/supabase-rest.ts`). Ninguna variable `NEXT_PUBLIC_` contiene secretos. |
| 2 | Eliminar secretos de Git | Revisado todo el historial: solo hay valores de ejemplo. `.env*` está en `.gitignore`. |
| 3 | Key pública para la DB | El navegador nunca habla con Supabase: todo pasa por `/api/store`. La clave pública no se usa. |
| 4 | Row-Level Security | Migración `20261011000000_…sql`: RLS forzado en las 6 tablas, sin acceso para `anon`/`authenticated`. |
| 5 | Encriptar datos sensibles | Supabase cifra los datos en disco (AES-256) y todo viaja por HTTPS. No se guardan tarjetas ni contraseñas de clientes. |
| 6 | Forzar autenticación | Toda acción de admin y la subida de fotos exigen sesión válida (`ADMIN_ACTIONS`, `app/api/admin/upload`). |
| 7 | Restringir acceso a registros | Pedidos, vendedores y productos ocultos solo se devuelven con sesión de admin. |
| 8 | Bloquear manipulación de campos | Precios y totales se recalculan en la base de datos; solo se guardan campos de una lista permitida (`lib/server/validate.ts`, `mappers.ts`). |
| 9 | Proteger cookies de sesión | `httpOnly`, `secure`, `sameSite=strict`, firmada con HMAC y con vencimiento de 12 h en el servidor. Cambiar la contraseña cierra todas las sesiones. |
| 10 | Hashear contraseñas | La contraseña del panel se compara por su huella SHA-256 en tiempo constante; nunca se guarda en la base de datos ni en el navegador. |
| 11 | Rate limiting | Login: 5 intentos fallidos / 15 min. Pedidos: 6 / 10 min. API: 240 / min. Fotos: 80 / 10 min. Todo por IP (`lib/security/rate-limit.ts`). |
| 12 | Protección contra bots | Campo trampa invisible y tiempo mínimo de 3 s en el checkout. |
| 13 | Parametrizar queries | Los IDs se validan con una lista de caracteres permitidos antes de usarlos en filtros; las funciones SQL reciben parámetros. |
| 14 | Validar inputs | Largos máximos, números con rango, métodos de pago/entrega de una lista fija, teléfono y correo validados en el servidor. |
| 15 | Sanitizar contenido | Se eliminan caracteres de control; las URLs de fotos solo pueden ser HTTPS o rutas propias (bloquea `javascript:`). React escapa todo el texto. |
| 16 | Restringir archivos | Solo imágenes (se verifica el contenido real), máx. 4 MB, se re-codifican a WebP 1600 px y se eliminan metadatos (GPS, etc.). |
| 17 | Devolver solo datos necesarios | Al público no se le muestran errores técnicos de la base de datos; las respuestas de la API no se guardan en caché. |
| 18 | Security headers | CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP (`next.config.js`). |
| 19 | Forzar HTTPS | HSTS de 2 años + `upgrade-insecure-requests`; Vercel redirige HTTP a HTTPS; ya no se aceptan fotos por `http://`. |
| 20 | Escanear dependencias | `npm audit` = 0 vulnerabilidades tras actualizar a Next.js 16 y React 19. Repetir `npm audit` cada mes. |

## Límites conocidos

- El rate limiting vive en la memoria de cada instancia de Vercel. Frena
  ataques normales; para algo más estricto haría falta un almacén compartido
  (por ejemplo Upstash Redis).
- La carpeta `google-apps-script/` es de la versión anterior y no la usa la
  tienda actual.
