-- Perferm — keep policy helpers out of the exposed API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Policies reference these by OID, so moving them re-points every policy to the
-- non-exposed schema (not callable through /rest/v1/rpc).
alter function public.is_admin() set schema private;
alter function public.has_purchased(uuid) set schema private;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.has_purchased(uuid) to authenticated;

-- Same logic under the old names for SECURITY DEFINER callers; not executable by API roles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
create or replace function public.has_purchased(p_product_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.user_id = (select auth.uid()) and oi.product_id = p_product_id and o.status = 'delivered'
  );
$$;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.has_purchased(uuid) from public, anon, authenticated;
