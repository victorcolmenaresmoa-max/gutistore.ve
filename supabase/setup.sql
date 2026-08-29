-- GutiStore · migración multirubro
-- Fecha: 2026-08-29
-- Objetivo: evolucionar el esquema existente sin borrar productos, pedidos ni vendedores.

create extension if not exists pgcrypto;

-- ============================================================
-- 1) Categorías dinámicas
-- ============================================================
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categorias_active_order_idx
  on public.categorias (is_active, display_order, name);

insert into public.categorias (name, slug, description, display_order, is_active, is_featured)
values ('Suplementos', 'suplementos', 'Suplementos y productos de nutrición deportiva.', 10, true, true)
on conflict (slug) do nothing;

-- ============================================================
-- 2) Generalización no destructiva de productos
-- ============================================================
alter table public.productos add column if not exists slug text;
alter table public.productos add column if not exists descripcion_corta text not null default '';
alter table public.productos add column if not exists precio_anterior numeric;
alter table public.productos add column if not exists categoria_id uuid references public.categorias(id) on delete restrict;
alter table public.productos add column if not exists marca text not null default '';
alter table public.productos add column if not exists sku text not null default '';
alter table public.productos add column if not exists estado text not null default 'active';
alter table public.productos add column if not exists activo boolean not null default true;
alter table public.productos add column if not exists promocion_activa boolean not null default false;
alter table public.productos add column if not exists atributos jsonb not null default '[]'::jsonb;
alter table public.productos add column if not exists created_at timestamptz not null default now();
alter table public.productos add column if not exists updated_at timestamptz not null default now();

-- Todos los productos preexistentes pertenecían a la tienda de suplementos.
-- Se conserva intacta la columna antigua `categoria` para no perder su clasificación previa.
update public.productos
set categoria_id = (select id from public.categorias where slug = 'suplementos' limit 1)
where categoria_id is null;

-- Generar slugs únicos para registros antiguos.
do $$
declare
  r record;
  base_slug text;
  candidate text;
  n integer;
begin
  for r in select id, nombre from public.productos where slug is null or btrim(slug) = '' loop
    base_slug := lower(regexp_replace(translate(coalesce(r.nombre, 'producto'),
      'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'producto'; end if;
    candidate := base_slug;
    n := 2;
    while exists(select 1 from public.productos p where p.slug = candidate and p.id <> r.id) loop
      candidate := base_slug || '-' || n;
      n := n + 1;
    end loop;
    update public.productos set slug = candidate where id = r.id;
  end loop;
end $$;

alter table public.productos alter column slug set not null;
create unique index if not exists productos_slug_unique_idx on public.productos(slug);
create index if not exists productos_categoria_idx on public.productos(categoria_id);
create index if not exists productos_public_idx on public.productos(activo, estado, destacado);
create index if not exists productos_marca_idx on public.productos(marca);

-- ============================================================
-- 3) Variantes dinámicas
-- ============================================================
create table if not exists public.variantes_producto (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.productos(id) on delete restrict,
  sku text not null default '',
  price numeric,
  compare_at_price numeric,
  stock integer not null default 0 check (stock >= 0),
  image text not null default '',
  active boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists variantes_product_idx on public.variantes_producto(product_id, active);
create index if not exists variantes_sku_idx on public.variantes_producto(sku);

-- ============================================================
-- 4) Pedidos: asegurar columnas necesarias sin tocar históricos
-- ============================================================
alter table public.pedidos add column if not exists email text;
alter table public.pedidos add column if not exists direccion text;
alter table public.pedidos add column if not exists metodo_entrega text;
alter table public.pedidos add column if not exists metodo_pago text;
alter table public.pedidos add column if not exists notas text;
alter table public.pedidos add column if not exists vendedor_id uuid;
alter table public.pedidos add column if not exists vendedor_codigo text;
alter table public.pedidos add column if not exists vendedor_nombre text;
alter table public.pedidos add column if not exists estado text not null default 'Pendiente';

-- ============================================================
-- 5) updated_at automático
-- ============================================================
create or replace function public.gutistore_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categorias_touch_updated_at on public.categorias;
create trigger categorias_touch_updated_at before update on public.categorias
for each row execute function public.gutistore_touch_updated_at();

drop trigger if exists productos_touch_updated_at on public.productos;
create trigger productos_touch_updated_at before update on public.productos
for each row execute function public.gutistore_touch_updated_at();

drop trigger if exists variantes_touch_updated_at on public.variantes_producto;
create trigger variantes_touch_updated_at before update on public.variantes_producto
for each row execute function public.gutistore_touch_updated_at();

-- ============================================================
-- 6) Storage público para imágenes administradas desde GutiStore
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guti-store-media',
  'guti-store-media',
  true,
  12582912,
  array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']
)
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- La app sube y elimina archivos exclusivamente desde rutas server-side usando la clave secreta.
-- No se crean policies de escritura para usuarios anónimos.

-- ============================================================
-- 7) Reemplazar crear_pedido por una versión transaccional con variantes
--    La función calcula precios/stock en servidor y guarda snapshot del pedido.
-- ============================================================
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'crear_pedido'
  loop
    execute 'drop function if exists ' || r.signature || ' cascade';
  end loop;
end $$;

create function public.crear_pedido(
  p_cliente text,
  p_telefono text,
  p_ubicacion text,
  p_items jsonb,
  p_email text default '',
  p_direccion text default '',
  p_metodo_entrega text default 'Por confirmar',
  p_metodo_pago text default 'Por definir con el asesor',
  p_notas text default '',
  p_total numeric default 0,
  p_vendedor_codigo text default null
)
returns table(id uuid, saved boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product public.productos%rowtype;
  v_variant public.variantes_producto%rowtype;
  v_promotion public.promociones%rowtype;
  v_product_id uuid;
  v_variant_id uuid;
  v_promotion_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_subtotal numeric;
  v_total numeric := 0;
  v_snapshot jsonb := '[]'::jsonb;
  v_attrs jsonb;
  v_variant_label text;
  v_seller_id uuid;
  v_seller_code text;
  v_seller_name text;
begin
  if coalesce(btrim(p_cliente), '') = '' or coalesce(btrim(p_telefono), '') = '' or coalesce(btrim(p_ubicacion), '') = '' then
    raise exception 'Faltan datos obligatorios del cliente.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no contiene productos.';
  end if;

  if coalesce(btrim(p_vendedor_codigo), '') <> '' then
    select v.id, v.codigo, v.nombre
      into v_seller_id, v_seller_code, v_seller_name
    from public.vendedores v
    where upper(v.codigo) = upper(btrim(p_vendedor_codigo)) and v.activo = true
    limit 1;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((v_item->>'cantidad')::integer, 1));

    -- Compatibilidad con las promociones/combo existentes: se guardan como snapshot
    -- sin inventario propio, igual que en el flujo histórico de la tienda.
    if coalesce(v_item->>'promotionId','') <> '' then
      begin
        v_promotion_id := (v_item->>'promotionId')::uuid;
      exception when others then
        raise exception 'La promoción seleccionada no es válida.';
      end;

      select * into v_promotion from public.promociones pr
      where pr.id = v_promotion_id and coalesce(pr.activo, true) = true;
      if not found then raise exception 'Una de las promociones ya no está disponible.'; end if;

      v_unit_price := greatest(0, coalesce(v_promotion.precio, 0));
      v_subtotal := round(v_unit_price * v_qty, 2);
      v_total := v_total + v_subtotal;
      v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
        'id', v_promotion.id,
        'promotionId', v_promotion.id,
        'nombre', 'Oferta: ' || v_promotion.titulo,
        'sku', '',
        'imagen', coalesce(v_promotion.imagen, ''),
        'atributos', case when coalesce(btrim(v_promotion.productos), '') <> ''
          then jsonb_build_object('Incluye', replace(v_promotion.productos, E'\n', ' + '))
          else jsonb_build_object('Tipo', 'Promoción') end,
        'variante', null,
        'precio', v_unit_price,
        'cantidad', v_qty,
        'subtotal', v_subtotal
      ));
      continue;
    end if;

    begin
      v_product_id := coalesce(nullif(v_item->>'productId',''), nullif(v_item->>'id',''))::uuid;
    exception when others then
      raise exception 'El pedido contiene un producto inválido.';
    end;

    select * into v_product from public.productos p
    where p.id = v_product_id and p.activo = true and p.estado = 'active'
    for update;
    if not found then raise exception 'Uno de los productos ya no está disponible.'; end if;

    v_variant_id := null;
    if coalesce(v_item->>'variantId','') <> '' then
      begin v_variant_id := (v_item->>'variantId')::uuid;
      exception when others then raise exception 'La variante seleccionada no es válida.'; end;

      select * into v_variant from public.variantes_producto vp
      where vp.id = v_variant_id and vp.product_id = v_product_id and vp.active = true
      for update;
      if not found then raise exception 'La variante seleccionada ya no está disponible.'; end if;
      if v_variant.stock < v_qty then raise exception 'Stock insuficiente para %.', v_product.nombre; end if;

      v_unit_price := coalesce(v_variant.price, v_product.precio);
      v_attrs := coalesce(v_variant.attributes, '{}'::jsonb);
      select string_agg(key || ': ' || value, ' · ' order by key)
        into v_variant_label
      from jsonb_each_text(v_attrs);

      update public.variantes_producto set stock = stock - v_qty where id = v_variant.id;
      update public.productos
      set stock = coalesce((select sum(stock) from public.variantes_producto where product_id = v_product.id and active = true), 0)
      where id = v_product.id;
    else
      if exists(select 1 from public.variantes_producto where product_id = v_product.id and active = true) then
        raise exception 'Debes seleccionar una variante para %.', v_product.nombre;
      end if;
      if v_product.stock < v_qty then raise exception 'Stock insuficiente para %.', v_product.nombre; end if;
      v_unit_price := v_product.precio;
      v_attrs := '{}'::jsonb;
      v_variant_label := null;
      update public.productos set stock = stock - v_qty where id = v_product.id;
    end if;

    v_subtotal := round(v_unit_price * v_qty, 2);
    v_total := v_total + v_subtotal;

    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'productId', v_product.id,
      'variantId', v_variant_id,
      'nombre', v_product.nombre,
      'sku', coalesce(case when v_variant_id is not null then v_variant.sku else null end, v_product.sku, ''),
      'imagen', coalesce(case when v_variant_id is not null and coalesce(v_variant.image,'') <> '' then v_variant.image else null end, v_product.imagen, ''),
      'atributos', v_attrs,
      'variante', v_variant_label,
      'precio', v_unit_price,
      'cantidad', v_qty,
      'subtotal', v_subtotal
    ));
  end loop;

  insert into public.pedidos (
    id, fecha, cliente, telefono, email, ubicacion, direccion,
    metodo_entrega, metodo_pago, notas, items, total,
    vendedor_id, vendedor_codigo, vendedor_nombre, estado
  ) values (
    v_order_id, now(), btrim(p_cliente), btrim(p_telefono), nullif(btrim(p_email), ''), btrim(p_ubicacion), nullif(btrim(p_direccion), ''),
    coalesce(nullif(btrim(p_metodo_entrega), ''), 'Por confirmar'),
    coalesce(nullif(btrim(p_metodo_pago), ''), 'Por definir con el asesor'),
    nullif(btrim(p_notas), ''), v_snapshot, round(v_total, 2),
    v_seller_id, v_seller_code, v_seller_name, 'Pendiente'
  );

  return query select v_order_id, true;
end;
$$;

revoke all on function public.crear_pedido(text,text,text,jsonb,text,text,text,text,text,numeric,text) from public;
grant execute on function public.crear_pedido(text,text,text,jsonb,text,text,text,text,text,numeric,text) to service_role;
-- La función se invoca exclusivamente desde la API privada de Next.js con la clave secreta.

-- ============================================================
-- 8) Comentarios de mantenimiento
-- ============================================================
comment on table public.categorias is 'Categorías dinámicas administrables de GutiStore.';
comment on table public.variantes_producto is 'Variantes por combinación de atributos, con SKU/precio/stock individual.';
comment on column public.productos.atributos is 'Atributos generales flexibles [{name,value}].';
