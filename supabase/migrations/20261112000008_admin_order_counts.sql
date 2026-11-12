-- Perferm — order counts per status for the admin orders tabs, in one query
-- (replaces one count request per status).
create or replace function public.admin_order_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return coalesce(
    (select jsonb_object_agg(status, n) from (select status, count(*) as n from public.orders group by status) c),
    '{}'::jsonb
  );
end;
$$;

revoke execute on function public.admin_order_counts() from public, anon;
grant execute on function public.admin_order_counts() to authenticated;
