-- =====================================================================
--  GutiStore · Ampliación del e-commerce
--  ---------------------------------------------------------------------
--  Qué hace este script (es seguro ejecutarlo más de una vez):
--    1. Agrega a `productos` las columnas del modelo general (marca, SKU,
--       precio anterior, subcategoría, variantes, etiquetas, etc.).
--       No borra ni renombra ninguna columna existente.
--    2. La PRIMERA vez que se ejecuta, convierte los productos actuales en
--       la categoría "Suplementos" y guarda su categoría anterior
--       (Proteína, Rendimiento...) como subcategoría. No se pierde nada.
--    3. Genera slugs (URLs amigables) únicos para los productos.
--    4. Crea la tabla `tienda_categorias` (categorías y subcategorías administrables).
--       Se usa un nombre propio para no tocar otras tablas `categorias` que ya existan.
--    5. Agrega a `pedidos` columnas para controlar inventario.
--    6. Crea funciones para registrar pedidos con control de stock por
--       variante y para devolver el stock cuando un pedido se cancela.
--       La función original `crear_pedido` NO se modifica: la nueva la usa
--       internamente, así que la lógica de vendedores (?ref=) se conserva.
--
--  Cómo ejecutarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. Utilidad: slug a partir de un texto (sin depender de extensiones)
-- ---------------------------------------------------------------------
create or replace function public.gutistore_slugify(p_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p_text, ''),
      'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
      'aaaaaaeeeeiiiiooooouuuuncaaaaaaeeeeiiiiooooouuuunc')),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------
-- 1. Productos: nuevas columnas + conversión inicial a "Suplementos"
-- ---------------------------------------------------------------------
do $$
declare
  v_first_run boolean;
begin
  select not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'productos' and column_name = 'subcategoria'
  ) into v_first_run;

  alter table public.productos
    add column if not exists slug                  text,
    add column if not exists descripcion_corta     text        not null default '',
    add column if not exists precio_anterior       numeric(12,2) not null default 0,
    add column if not exists subcategoria          text        not null default '',
    add column if not exists marca                 text        not null default '',
    add column if not exists sku                   text        not null default '',
    add column if not exists nuevo                 boolean     not null default false,
    add column if not exists oferta                boolean     not null default false,
    add column if not exists activo                boolean     not null default true,
    add column if not exists etiquetas             jsonb       not null default '[]'::jsonb,
    add column if not exists caracteristicas       jsonb       not null default '[]'::jsonb,
    add column if not exists especificaciones      jsonb       not null default '[]'::jsonb,
    add column if not exists material              text        not null default '',
    add column if not exists genero                text        not null default '',
    add column if not exists capacidad             text        not null default '',
    add column if not exists informacion_adicional text        not null default '',
    add column if not exists opcion_variante       text        not null default '',
    add column if not exists variantes             jsonb       not null default '[]'::jsonb,
    add column if not exists created_at            timestamptz not null default now(),
    add column if not exists updated_at            timestamptz not null default now();

  if v_first_run then
    -- Los productos actuales son suplementos: su categoría anterior pasa a ser
    -- la subcategoría y todos quedan dentro de "Suplementos".
    update public.productos
       set subcategoria = coalesce(nullif(trim(categoria), ''), ''),
           categoria    = 'Suplementos'
     where coalesce(trim(categoria), '') <> 'Suplementos';
  end if;
end $$;

-- Slugs únicos para productos que aún no lo tienen.
with base as (
  select p.id,
         coalesce(nullif(public.gutistore_slugify(p.nombre), ''), 'producto') as s,
         row_number() over (
           partition by coalesce(nullif(public.gutistore_slugify(p.nombre), ''), 'producto')
           order by p.created_at, p.id::text
         ) as rn
    from public.productos p
   where p.slug is null or p.slug = ''
)
update public.productos p
   set slug = case
                when b.rn = 1 and not exists (select 1 from public.productos o where o.slug = b.s)
                  then b.s
                else b.s || '-' || left(replace(p.id::text, '-', ''), 6)
              end
  from base b
 where p.id = b.id;

create unique index if not exists productos_slug_key
  on public.productos (slug) where slug is not null and slug <> '';
create index if not exists productos_activo_categoria_idx
  on public.productos (activo, categoria);
create index if not exists productos_created_at_idx
  on public.productos (created_at desc);

-- updated_at automático y slug de respaldo si alguien inserta sin slug.
create or replace function public.gutistore_productos_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.slug is null or new.slug = '' then
    new.slug := coalesce(nullif(public.gutistore_slugify(new.nombre), ''), 'producto')
                || '-' || left(replace(coalesce(new.id::text, gen_random_uuid()::text), '-', ''), 6);
  end if;
  return new;
end;
$$;

drop trigger if exists gutistore_productos_before_write on public.productos;
create trigger gutistore_productos_before_write
  before insert or update on public.productos
  for each row execute function public.gutistore_productos_before_write();

-- ---------------------------------------------------------------------
-- 2. Categorías y subcategorías administrables
-- ---------------------------------------------------------------------
create table if not exists public.tienda_categorias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text        not null,
  slug        text        not null,
  descripcion text        not null default '',
  imagen      text        not null default '',
  parent_id   uuid        references public.tienda_categorias(id) on delete cascade,
  orden       integer     not null default 0,
  activo      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create unique index if not exists tienda_categorias_slug_key on public.tienda_categorias (slug);
create unique index if not exists tienda_categorias_nombre_parent_key
  on public.tienda_categorias (lower(nombre), coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists tienda_categorias_parent_idx on public.tienda_categorias (parent_id, orden);

-- Solo el servidor (clave secreta) accede a esta tabla.
alter table public.tienda_categorias enable row level security;

-- Categorías iniciales sugeridas (solo se muestran en la tienda cuando tienen productos).
insert into public.tienda_categorias (nombre, slug, orden)
select v.nombre, v.slug, v.orden
  from (values
    ('Suplementos', 'suplementos', 1),
    ('Ropa',        'ropa',        2),
    ('Calzado',     'calzado',     3),
    ('Accesorios',  'accesorios',  4),
    ('Lentes',      'lentes',      5),
    ('Hidratación', 'hidratacion', 6)
  ) as v(nombre, slug, orden)
on conflict do nothing;

-- Cualquier otra categoría que ya exista en productos.
insert into public.tienda_categorias (nombre, slug, orden)
select distinct on (public.gutistore_slugify(p.categoria))
       trim(p.categoria), public.gutistore_slugify(p.categoria), 50
  from public.productos p
 where coalesce(trim(p.categoria), '') <> ''
   and public.gutistore_slugify(p.categoria) <> ''
on conflict do nothing;

-- Subcategorías que ya existen en productos.
insert into public.tienda_categorias (nombre, slug, parent_id, orden)
select distinct on (c.id, public.gutistore_slugify(p.subcategoria))
       trim(p.subcategoria), c.slug || '-' || public.gutistore_slugify(p.subcategoria), c.id, 0
  from public.productos p
  join public.tienda_categorias c
    on c.parent_id is null and lower(c.nombre) = lower(trim(p.categoria))
 where coalesce(trim(p.subcategoria), '') <> ''
   and public.gutistore_slugify(p.subcategoria) <> ''
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 3. Pedidos: control de inventario
-- ---------------------------------------------------------------------
alter table public.pedidos
  add column if not exists control_stock    boolean not null default false,
  add column if not exists stock_descontado boolean not null default false;

-- ---------------------------------------------------------------------
-- 4. Registrar pedido con validación y descuento de stock
--    - Recalcula precios desde la base de datos (no confía en el navegador).
--    - Bloquea cada producto (FOR UPDATE) para evitar ventas dobles.
--    - Descuenta stock de la variante elegida o el stock general.
--    - Llama a la función original crear_pedido (vendedores incluidos).
--    Si algo falla, no se guarda nada y el stock no cambia.
-- ---------------------------------------------------------------------
create or replace function public.crear_pedido_gutistore(
  p_cliente         text,
  p_telefono        text,
  p_ubicacion       text,
  p_items           jsonb,
  p_email           text default '',
  p_direccion       text default '',
  p_metodo_entrega  text default 'Por confirmar',
  p_metodo_pago     text default 'Por definir con el asesor',
  p_notas           text default '',
  p_vendedor_codigo text default null
)
returns table (id text, saved boolean, total numeric, items jsonb)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_item       jsonb;
  v_qty        integer;
  v_prod       public.productos%rowtype;
  v_promo      record;
  v_variants   jsonb;
  v_variant    jsonb;
  v_idx        integer;
  v_price      numeric;
  v_stock      integer;
  v_label      text;
  v_line       jsonb;
  v_lines      jsonb := '[]'::jsonb;
  v_total      numeric := 0;
  v_args       text;
  v_items_cast text;
  v_result     jsonb;
  v_id         text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;
  if jsonb_array_length(p_items) > 60 then
    raise exception 'El pedido tiene demasiadas líneas.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := floor(coalesce(nullif(v_item->>'cantidad', '')::numeric, 0))::integer;
    if v_qty < 1 or v_qty > 999 then
      raise exception 'Cantidad no válida para "%".', coalesce(v_item->>'nombre', 'un producto');
    end if;

    if coalesce(v_item->>'tipo', 'producto') = 'promocion' then
      select * into v_promo
        from public.promociones pr
       where pr.id::text = coalesce(v_item->>'productId', v_item->>'id')
         and coalesce(pr.activo, true);
      if not found then
        raise exception 'La promoción "%" ya no está disponible.', coalesce(v_item->>'nombre', '');
      end if;
      v_price := coalesce(v_promo.precio, 0);
      v_line := jsonb_build_object(
        'id', v_promo.id::text, 'productId', v_promo.id::text, 'tipo', 'promocion',
        'nombre', v_promo.titulo, 'precio', v_price, 'cantidad', v_qty,
        'subtotal', v_price * v_qty, 'imagen', coalesce(v_promo.imagen, ''));
    else
      select * into v_prod
        from public.productos pr
       where pr.id::text = coalesce(v_item->>'productId', v_item->>'id')
       for update;
      if not found or not coalesce(v_prod.activo, true) then
        raise exception 'El producto "%" ya no está disponible.', coalesce(v_item->>'nombre', '');
      end if;

      v_variants := coalesce(v_prod.variantes, '[]'::jsonb);

      if exists (
        select 1 from jsonb_array_elements(v_variants) e
         where coalesce((e->>'activo')::boolean, true)
      ) then
        if coalesce(v_item->>'varianteId', '') = '' then
          raise exception 'Elige las opciones de "%" antes de continuar.', v_prod.nombre;
        end if;

        v_variant := null;
        select (t.ord - 1)::integer, t.e into v_idx, v_variant
          from jsonb_array_elements(v_variants) with ordinality as t(e, ord)
         where t.e->>'id' = v_item->>'varianteId'
         limit 1;

        if v_variant is null or not coalesce((v_variant->>'activo')::boolean, true) then
          raise exception 'La opción elegida de "%" ya no está disponible.', v_prod.nombre;
        end if;

        v_label := concat_ws(' / ',
          nullif(v_variant->'color'->>'nombre', ''),
          nullif(v_variant->>'talla', ''),
          nullif(v_variant->>'opcion', ''));
        v_stock := floor(coalesce(nullif(v_variant->>'stock', '')::numeric, 0))::integer;

        if v_stock < v_qty then
          if v_stock <= 0 then
            raise exception '"%" (%) está agotado.', v_prod.nombre, v_label;
          end if;
          if v_stock = 1 then
            raise exception 'Solo queda 1 unidad de "%" (%).', v_prod.nombre, v_label;
          end if;
          raise exception 'Solo quedan % unidades de "%" (%).', v_stock, v_prod.nombre, v_label;
        end if;

        v_price := case
                     when coalesce(nullif(v_variant->>'precio', '')::numeric, 0) > 0
                       then (v_variant->>'precio')::numeric
                     else v_prod.precio
                   end;

        update public.productos
           set variantes = jsonb_set(variantes, array[v_idx::text, 'stock'], to_jsonb(v_stock - v_qty))
         where productos.id = v_prod.id;

        v_line := jsonb_build_object(
          'id', v_prod.id::text, 'productId', v_prod.id::text, 'tipo', 'producto',
          'nombre', v_prod.nombre, 'precio', v_price, 'cantidad', v_qty,
          'subtotal', v_price * v_qty,
          'varianteId', v_variant->>'id', 'varianteNombre', v_label,
          'color', coalesce(v_variant->'color'->>'nombre', ''),
          'talla', coalesce(v_variant->>'talla', ''),
          'opcion', coalesce(v_variant->>'opcion', ''),
          'opcionNombre', coalesce(v_prod.opcion_variante, ''),
          'sku', coalesce(nullif(v_variant->>'sku', ''), v_prod.sku, ''),
          'imagen', coalesce(nullif(v_variant->>'imagen', ''), v_prod.imagen, ''));
      else
        v_stock := coalesce(v_prod.stock, 0)::integer;
        if v_stock < v_qty then
          if v_stock <= 0 then
            raise exception '"%" está agotado.', v_prod.nombre;
          end if;
          if v_stock = 1 then
            raise exception 'Solo queda 1 unidad de "%".', v_prod.nombre;
          end if;
          raise exception 'Solo quedan % unidades de "%".', v_stock, v_prod.nombre;
        end if;
        v_price := v_prod.precio;

        update public.productos set stock = v_stock - v_qty where productos.id = v_prod.id;

        v_line := jsonb_build_object(
          'id', v_prod.id::text, 'productId', v_prod.id::text, 'tipo', 'producto',
          'nombre', v_prod.nombre, 'precio', v_price, 'cantidad', v_qty,
          'subtotal', v_price * v_qty, 'sku', coalesce(v_prod.sku, ''),
          'imagen', coalesce(v_prod.imagen, ''));
      end if;
    end if;

    v_lines := v_lines || jsonb_build_array(v_line);
    v_total := v_total + v_price * v_qty;
  end loop;

  -- Se usa la función original para guardar el pedido y validar el vendedor.
  select pg_get_function_identity_arguments(p.oid) into v_args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'crear_pedido'
   limit 1;
  if v_args is null then
    raise exception 'No existe la función public.crear_pedido en la base de datos.';
  end if;
  v_items_cast := case when v_args ~ 'p_items json($|[^b])' then 'json' else 'jsonb' end;

  execute format(
    'select to_jsonb(r) from public.crear_pedido(
        p_cliente => $1, p_telefono => $2, p_ubicacion => $3, p_items => $4::%s,
        p_email => $5, p_direccion => $6, p_metodo_entrega => $7, p_metodo_pago => $8,
        p_notas => $9, p_total => $10, p_vendedor_codigo => $11) as r limit 1',
    v_items_cast)
    into v_result
    using p_cliente, p_telefono, p_ubicacion, v_lines, p_email, p_direccion,
          p_metodo_entrega, p_metodo_pago, p_notas, round(v_total, 2), p_vendedor_codigo;

  v_id := coalesce(
    v_result->>'id',
    v_result->>'r',
    v_result->'crear_pedido'->>'id',
    case when jsonb_typeof(v_result) = 'string' then v_result #>> '{}' end
  );

  if v_id is not null then
    update public.pedidos
       set control_stock = true, stock_descontado = true
     where pedidos.id::text = v_id;
  end if;

  return query select v_id, true, round(v_total, 2), v_lines;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Cambiar el estado de un pedido ajustando el inventario
--    - Pasar a "Cancelado" devuelve el stock (una sola vez).
--    - Sacar un pedido de "Cancelado" vuelve a descontarlo (si hay stock).
--    - Los pedidos anteriores a esta migración no tocan el inventario.
-- ---------------------------------------------------------------------
create or replace function public.cambiar_estado_pedido(p_pedido_id text, p_estado text)
returns boolean
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_order   record;
  v_item    jsonb;
  v_prod    public.productos%rowtype;
  v_variant jsonb;
  v_idx     integer;
  v_qty     integer;
  v_sign    integer := 0;
  v_stock   integer;
begin
  select * into v_order from public.pedidos where pedidos.id::text = p_pedido_id for update;
  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if coalesce(v_order.control_stock, false) then
    if p_estado = 'Cancelado' and v_order.stock_descontado then
      v_sign := 1;   -- devolver stock
    elsif p_estado <> 'Cancelado' and not v_order.stock_descontado then
      v_sign := -1;  -- volver a descontar
    end if;
  end if;

  if v_sign <> 0 then
    for v_item in select value from jsonb_array_elements(coalesce(v_order.items::jsonb, '[]'::jsonb)) loop
      continue when coalesce(v_item->>'tipo', 'producto') = 'promocion';
      v_qty := floor(coalesce(nullif(v_item->>'cantidad', '')::numeric, 0))::integer;
      continue when v_qty <= 0;

      select * into v_prod from public.productos pr
       where pr.id::text = coalesce(v_item->>'productId', v_item->>'id')
       for update;
      continue when not found;

      if coalesce(v_item->>'varianteId', '') <> '' then
        v_variant := null;
        select (t.ord - 1)::integer, t.e into v_idx, v_variant
          from jsonb_array_elements(coalesce(v_prod.variantes, '[]'::jsonb)) with ordinality as t(e, ord)
         where t.e->>'id' = v_item->>'varianteId'
         limit 1;
        continue when v_variant is null;

        v_stock := floor(coalesce(nullif(v_variant->>'stock', '')::numeric, 0))::integer + v_sign * v_qty;
        if v_stock < 0 then
          raise exception 'No hay stock suficiente de "%" para reactivar el pedido.', v_prod.nombre;
        end if;
        update public.productos
           set variantes = jsonb_set(variantes, array[v_idx::text, 'stock'], to_jsonb(v_stock))
         where productos.id = v_prod.id;
      else
        v_stock := coalesce(v_prod.stock, 0)::integer + v_sign * v_qty;
        if v_stock < 0 then
          raise exception 'No hay stock suficiente de "%" para reactivar el pedido.', v_prod.nombre;
        end if;
        update public.productos set stock = v_stock where productos.id = v_prod.id;
      end if;
    end loop;
  end if;

  update public.pedidos
     set estado = p_estado,
         stock_descontado = case when v_sign = 0 then stock_descontado else (v_sign = -1) end
   where pedidos.id::text = p_pedido_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Permisos: estas funciones solo se ejecutan desde el servidor de Vercel
-- ---------------------------------------------------------------------
revoke all on function public.crear_pedido_gutistore(text, text, text, jsonb, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.cambiar_estado_pedido(text, text) from public, anon, authenticated;
grant execute on function public.crear_pedido_gutistore(text, text, text, jsonb, text, text, text, text, text, text) to service_role;
grant execute on function public.cambiar_estado_pedido(text, text) to service_role;

-- Recarga el esquema de la API para que PostgREST vea las columnas nuevas.
notify pgrst, 'reload schema';
