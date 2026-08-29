# Cambios de arquitectura — GutiStore

- Supabase PostgreSQL sigue siendo la fuente de datos.
- Se agregaron `categorias` y `variantes_producto` sin borrar información existente.
- Los productos ahora admiten atributos dinámicos y variantes con stock individual.
- `crear_pedido` valida y descuenta inventario dentro de una transacción y guarda un snapshot de la compra.
- Supabase Storage recibe las imágenes subidas desde el admin.
- El panel y las APIs administrativas permanecen protegidos por sesión de servidor.
- El sistema de vendedores/referidos se mantiene compatible con los códigos actuales.
