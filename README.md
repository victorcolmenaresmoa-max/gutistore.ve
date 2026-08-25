# GutiSupplements

Tienda desarrollada con Next.js 14, desplegable en Vercel y conectada a Supabase.

## Inicio local

1. Copia `.env.example` como `.env.local`.
2. Completa las variables de Supabase y administración.
3. Ejecuta:

```bash
npm install
npm run dev
```

## Producción

Consulta [MIGRACION-SUPABASE.md](./MIGRACION-SUPABASE.md) para configurar GitHub,
Vercel y Supabase.

## Base de datos

El proyecto utiliza estas tablas del esquema `public`:

- `productos`
- `promociones`
- `pedidos`
- `vendedores`
- `configuracion`

Los pedidos públicos se crean mediante la función PostgreSQL `crear_pedido` que ya fue
incluida en el script de migración de Supabase.
