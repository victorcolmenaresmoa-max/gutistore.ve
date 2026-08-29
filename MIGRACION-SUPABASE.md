# Migración de GutiStore en Supabase

Ejecuta `supabase/migrations/20260829_gutistore_multirubro.sql` una sola vez sobre la base de datos actual.

La migración conserva los datos existentes y agrega: categorías dinámicas, campos generales de producto, atributos, variantes, columnas de pedidos necesarias, bucket de Storage y la versión transaccional de `crear_pedido` que valida stock y genera snapshots históricos.

Los productos existentes sin categoría dinámica se asignan a **Suplementos**. La columna heredada `categoria` se conserva por compatibilidad. No hace falta usar Google Sheets ni Google Apps Script.

Después de ejecutar el SQL, configura las variables de `.env.example`, entra a `/admin` y realiza los casos de QA indicados en `README.md`.
