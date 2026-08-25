# Cambios realizados

- Se reemplazó la conexión a Google Apps Script por rutas internas de Next.js.
- Se conectaron productos, promociones, pedidos, vendedores y configuración con Supabase.
- Se conservaron las interfaces y el diseño existentes.
- Se mantuvo la función de referidos por `?ref=CODIGO`.
- Se mantuvo la creación pública de pedidos mediante `crear_pedido`.
- Se trasladó la contraseña administrativa al servidor.
- Se eliminó el token administrativo público del navegador.
- Se añadió una cookie administrativa `HttpOnly`, válida durante 12 horas.
- Se eliminaron los archivos del Google Apps Script y las instrucciones antiguas.
- Se añadió una guía detallada en `MIGRACION-SUPABASE.md`.

## Archivos principales modificados

- `lib/api.ts`
- `app/admin/page.tsx`
- `types/index.ts`
- `.env.example`

## Archivos principales añadidos

- `app/api/store/route.ts`
- `app/api/admin/session/route.ts`
- `lib/supabase-rest.ts`
- `lib/admin-auth.ts`
- `MIGRACION-SUPABASE.md`
