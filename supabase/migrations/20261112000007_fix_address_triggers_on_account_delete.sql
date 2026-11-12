-- Account deletion cascades run as the Auth service role, which has no rights
-- on public tables. Address/wishlist triggers therefore run as their owner;
-- they only ever touch rows belonging to the same user.
create or replace function public.addresses_after_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Skip during account deletion (the whole address book is being removed).
  if old.is_default and exists (select 1 from public.profiles where id = old.user_id) then
    update public.addresses set is_default = true
    where id = (select id from public.addresses where user_id = old.user_id order by created_at desc limit 1);
  end if;
  return old;
end;
$$;

alter function public.addresses_before_write() security definer;
alter function public.wishlist_before_insert() security definer;
revoke execute on function public.addresses_after_delete() from public, anon, authenticated;
revoke execute on function public.addresses_before_write() from public, anon, authenticated;
revoke execute on function public.wishlist_before_insert() from public, anon, authenticated;
