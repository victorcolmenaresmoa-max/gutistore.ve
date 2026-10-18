-- =====================================================================
--  GutiStore · Arreglo del registro de pedidos
--  ---------------------------------------------------------------------
--  Problema: al finalizar un pedido aparecía el error
--    column reference "id" is ambiguous
--  Venía de la función ANTIGUA `crear_pedido` (creada a mano en Supabase,
--  no está en este repositorio), que `crear_pedido_gutistore` usaba por
--  dentro para guardar el pedido.
--
--  Qué hace este script (es seguro ejecutarlo más de una vez):
--    - Reemplaza `crear_pedido_gutistore` para que guarde el pedido ella
--      misma en `pedidos`, sin depender de la función antigua.
--    - Mantiene todo lo demás: precios tomados de la base de datos,
--      control de stock por variante, promociones y código de vendedor.
--    - Se adapta a las columnas que realmente tenga tu tabla `pedidos`.
--    - No borra la función antigua ni ningún dato.
--
--  Cómo ejecutarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- =====================================================================

alter table public.pedidos
  add column if not exists control_stock    boolean not null default false,
  add column if not exists stock_descontado boolean not null default false;

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
  v_item         jsonb;
  v_qty          integer;
  v_prod         public.productos%rowtype;
  v_promo        jsonb;
  v_variants     jsonb;
  v_variant      jsonb;
  v_idx          integer;
  v_price        numeric;
  v_stock        integer;
  v_label        text;
  v_line         jsonb;
  v_lines        jsonb := '[]'::jsonb;
  v_total        numeric := 0;
  v_code         text;
  v_seller_id    text;
  v_seller_name  text;
  v_seller_code  text;
  v_row          jsonb;
  v_cols         text;
  v_id_type      text;
  v_id_default   text;
  v_id_identity  text;
  v_fecha_def    text;
  v_id           text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;
  if jsonb_array_length(p_items) > 60 then
    raise exception 'El pedido tiene demasiadas líneas.';
  end if;
  if coalesce(trim(p_cliente), '') = '' or coalesce(trim(p_telefono), '') = '' then
    raise exception 'Datos de pedido incompletos.';
  end if;

  -- 1. Validar cada línea, tomar el precio real y descontar el stock.
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := floor(coalesce(nullif(v_item->>'cantidad', '')::numeric, 0))::integer;
    if v_qty < 1 or v_qty > 999 then
      raise exception 'Cantidad no válida para "%".', coalesce(v_item->>'nombre', 'un producto');
    end if;

    if coalesce(v_item->>'tipo', 'producto') = 'promocion' then
      -- Se lee como jsonb para no fallar si a la tabla le falta alguna columna.
      select to_jsonb(pr) into v_promo
        from public.promociones pr
       where pr.id::text = coalesce(v_item->>'productId', v_item->>'id')
         and coalesce(pr.activo, true);
      if v_promo is null then
        raise exception 'La promoción "%" ya no está disponible.', coalesce(v_item->>'nombre', '');
      end if;
      v_price := coalesce(nullif(v_promo->>'precio', '')::numeric, 0);
      v_line := jsonb_build_object(
        'id', v_promo->>'id', 'productId', v_promo->>'id', 'tipo', 'promocion',
        'nombre', coalesce(v_promo->>'titulo', v_item->>'nombre', 'Promoción'),
        'precio', v_price, 'cantidad', v_qty,
        'subtotal', v_price * v_qty, 'imagen', coalesce(v_promo->>'imagen', ''));
    else
      select * into v_prod
        from public.productos pr
       where pr.id::text = coalesce(v_item->>'productId', v_item->>'id')
       for update;
      if not found or not coalesce(v_prod.activo, true) then
        raise exception 'El producto "%" ya no está disponible.', coalesce(v_item->>'nombre', '');
      end if;

      v_variants := coalesce(v_prod.variantes, '[]'::jsonb);
      if jsonb_typeof(v_variants) <> 'array' then
        v_variants := '[]'::jsonb;
      end if;

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
                     else coalesce(v_prod.precio, 0)
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
        v_stock := floor(coalesce(v_prod.stock::numeric, 0))::integer;
        if v_stock < v_qty then
          if v_stock <= 0 then
            raise exception '"%" está agotado.', v_prod.nombre;
          end if;
          if v_stock = 1 then
            raise exception 'Solo queda 1 unidad de "%".', v_prod.nombre;
          end if;
          raise exception 'Solo quedan % unidades de "%".', v_stock, v_prod.nombre;
        end if;
        v_price := coalesce(v_prod.precio, 0);

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

  -- 2. Vendedor (?ref=CODIGO). Un código inexistente o inactivo no bloquea la compra.
  v_code := upper(trim(coalesce(p_vendedor_codigo, '')));
  if v_code <> '' and to_regclass('public.vendedores') is not null then
    select vd.id::text, vd.nombre, vd.codigo
      into v_seller_id, v_seller_name, v_seller_code
      from public.vendedores vd
     where upper(trim(vd.codigo)) = v_code
       and coalesce(vd.activo, true)
     limit 1;
  end if;

  -- 3. Guardar el pedido. Solo se escriben las columnas que existan en `pedidos`;
  --    las que no se envían toman su valor por defecto.
  v_row := jsonb_strip_nulls(jsonb_build_object(
    'cliente',          trim(p_cliente),
    'telefono',         trim(p_telefono),
    'email',            coalesce(p_email, ''),
    'ubicacion',        coalesce(p_ubicacion, ''),
    'direccion',        coalesce(p_direccion, ''),
    'metodo_entrega',   coalesce(p_metodo_entrega, 'Por confirmar'),
    'metodo_pago',      coalesce(p_metodo_pago, 'Por definir con el asesor'),
    'notas',            coalesce(p_notas, ''),
    'items',            v_lines,
    'total',            round(v_total, 2),
    'estado',           'Pendiente',
    'control_stock',    true,
    'stock_descontado', true,
    'vendedor_id',      v_seller_id,
    'vendedor_codigo',  v_seller_code,
    'vendedor_nombre',  v_seller_name
  ));

  -- Si la columna id no se genera sola, se crea aquí.
  select c.data_type, c.column_default, c.is_identity
    into v_id_type, v_id_default, v_id_identity
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'pedidos' and c.column_name = 'id';
  if v_id_default is null and coalesce(v_id_identity, 'NO') = 'NO' then
    if v_id_type in ('integer', 'bigint', 'smallint', 'numeric') then
      execute 'select coalesce(max(p.id), 0) + 1 from public.pedidos p' into v_id;
      v_row := v_row || jsonb_build_object('id', v_id);
    else
      v_row := v_row || jsonb_build_object('id', gen_random_uuid()::text);
    end if;
  end if;

  -- Si la columna fecha no tiene valor por defecto, se pone la fecha actual.
  select c.column_default into v_fecha_def
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'pedidos' and c.column_name = 'fecha';
  if found and v_fecha_def is null then
    v_row := v_row || jsonb_build_object('fecha', now());
  end if;

  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
    into v_cols
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name = 'pedidos'
     and c.is_generated = 'NEVER'
     and v_row ? c.column_name;

  execute format(
    'insert into public.pedidos (%1$s) select %1$s from jsonb_populate_record(null::public.pedidos, $1) returning pedidos.id::text',
    v_cols)
    into v_id
    using v_row;

  return query select v_id, true, round(v_total, 2), v_lines;
end;
$$;

-- Permisos: solo el servidor de Vercel (clave secreta) puede registrar pedidos.
revoke all on function public.crear_pedido_gutistore(text, text, text, jsonb, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.crear_pedido_gutistore(text, text, text, jsonb, text, text, text, text, text, text) to service_role;

-- Recarga el esquema de la API para que el cambio se aplique al instante.
notify pgrst, 'reload schema';
