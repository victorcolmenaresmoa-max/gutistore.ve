-- =====================================================================
-- GutiStore · Seguridad de la base de datos y almacenamiento de fotos
-- =====================================================================
-- Qué hace este archivo (se puede ejecutar más de una vez sin problema):
--
--   1. Activa Row-Level Security (RLS) en TODAS las tablas de la tienda.
--      Sin políticas públicas, nadie puede leer ni modificar datos usando
--      la clave pública (anon/publishable) de Supabase. Solo el servidor
--      de Vercel, que usa la clave secreta, puede acceder. Esto protege
--      sobre todo los pedidos (nombres, teléfonos y direcciones de clientes).
--
--   2. Quita los permisos directos de los roles públicos (anon y
--      authenticated) sobre esas tablas y sobre las funciones de pedidos.
--
--   3. Crea el bucket público "gutistore-fotos" para las fotos que se suben
--      desde el panel: cualquiera puede VERLAS, pero solo el servidor puede
--      subirlas, cambiarlas o borrarlas.
--
-- Cómo ejecutarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array['productos', 'pedidos', 'promociones', 'configuracion', 'vendedores', 'tienda_categorias']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('alter table public.%I force row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Funciones de pedidos: solo el servidor (service_role) puede ejecutarlas.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('crear_pedido', 'crear_pedido_gutistore', 'cambiar_estado_pedido')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end $$;

-- Bucket de fotos (público solo para lectura; máx. 5 MB; solo WebP, que es
-- el formato en el que el servidor guarda todas las fotos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gutistore-fotos', 'gutistore-fotos', true, 5242880, array['image/webp'])
on conflict (id) do update
   set public = true,
       file_size_limit = excluded.file_size_limit,
       allowed_mime_types = excluded.allowed_mime_types;

-- No se crea ninguna política de escritura para anon/authenticated en
-- storage.objects: así nadie puede subir ni borrar fotos con la clave
-- pública. El servidor usa la clave secreta, que no necesita políticas.

-- Comprobación: debería mostrar rls_activado = true en todas las filas.
select c.relname as tabla, c.relrowsecurity as rls_activado
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('productos', 'pedidos', 'promociones', 'configuracion', 'vendedores', 'tienda_categorias')
 order by 1;
