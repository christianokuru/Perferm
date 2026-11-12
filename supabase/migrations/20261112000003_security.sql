-- Perferm — row level security, grants and storage.
-- Default-deny: revoke everything, then grant the minimum each role needs.
-- The service role (server only) bypasses RLS and is used for checkout,
-- payment confirmation, rate limiting and public form submissions.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- RLS everywhere.
alter table public.profiles enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.store_settings enable row level security;
alter table public.addresses enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_collections enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payment_events enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.rate_limits enable row level security;
alter table public.audit_log enable row level security;

-- Helper functions callable from policies / the client.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_purchased(uuid) to authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text) to authenticated;
grant execute on function public.admin_add_order_note(uuid, text) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_customers(text, integer, integer) to authenticated;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;
-- Service-role-only operations.
grant execute on function public.create_order(jsonb, jsonb) to service_role;
grant execute on function public.confirm_order_payment(text, public.payment_provider, public.payment_mode, bigint, text) to service_role;
grant execute on function public.expire_pending_orders(interval) to service_role;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.purge_rate_limits() to service_role;

-- ---------------------------------------------------------------------------
-- profiles: read & edit your own name/phone; admins read all. Role is never client-writable.
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- addresses: fully private to their owner; admins can read (order support).
-- ---------------------------------------------------------------------------
grant select, insert, delete on public.addresses to authenticated;
grant update (label, recipient, phone, state, city, address, is_default) on public.addresses to authenticated;

create policy "addresses: read own or admin" on public.addresses
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "addresses: insert own" on public.addresses
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "addresses: update own" on public.addresses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "addresses: delete own" on public.addresses
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Public configuration: anyone reads, admins edit.
-- ---------------------------------------------------------------------------
grant select on public.delivery_zones to anon, authenticated;
grant update (fee_kobo, eta, is_active) on public.delivery_zones to authenticated;
create policy "zones: public read" on public.delivery_zones for select to anon, authenticated using (true);
create policy "zones: admin update" on public.delivery_zones for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.store_settings to anon, authenticated;
grant update (store_name, support_email, support_phone, announcement, pickup_enabled, pickup_address, pickup_hours, paystack_enabled, flutterwave_enabled, updated_by)
  on public.store_settings to authenticated;
create policy "settings: public read" on public.store_settings for select to anon, authenticated using (true);
create policy "settings: admin update" on public.store_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.collections to anon, authenticated;
grant insert, update, delete on public.collections to authenticated;
create policy "collections: public read" on public.collections for select to anon, authenticated using (true);
create policy "collections: admin insert" on public.collections for insert to authenticated with check ((select public.is_admin()));
create policy "collections: admin update" on public.collections for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collections: admin delete" on public.collections for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Catalogue: live products are public; archived ones only for admins.
-- rating / review_count are derived and not writable.
-- ---------------------------------------------------------------------------
grant select on public.products to anon, authenticated;
grant insert (slug, name, house, tagline, description, gender, concentration, families, notes_top, notes_heart, notes_base, longevity, sillage, is_new, is_bestseller, archived_at)
  on public.products to authenticated;
grant update (slug, name, house, tagline, description, gender, concentration, families, notes_top, notes_heart, notes_base, longevity, sillage, is_new, is_bestseller, archived_at)
  on public.products to authenticated;
grant delete on public.products to authenticated;

create policy "products: read live or admin" on public.products for select to anon, authenticated
  using (archived_at is null or (select public.is_admin()));
create policy "products: admin insert" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products for delete to authenticated using ((select public.is_admin()));

grant select on public.product_images, public.product_variants, public.product_collections to anon, authenticated;
grant insert, update, delete on public.product_images, public.product_variants, public.product_collections to authenticated;

create policy "images: read with product" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "images: admin insert" on public.product_images for insert to authenticated with check ((select public.is_admin()));
create policy "images: admin update" on public.product_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "images: admin delete" on public.product_images for delete to authenticated using ((select public.is_admin()));

create policy "variants: read with product" on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "variants: admin insert" on public.product_variants for insert to authenticated with check ((select public.is_admin()));
create policy "variants: admin update" on public.product_variants for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "variants: admin delete" on public.product_variants for delete to authenticated using ((select public.is_admin()));

create policy "product collections: read with product" on public.product_collections for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product collections: admin insert" on public.product_collections for insert to authenticated with check ((select public.is_admin()));
create policy "product collections: admin delete" on public.product_collections for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Orders: customers read their own; admins read all. All writes go through
-- service-role checkout code or the admin_set_order_status() state machine.
-- ---------------------------------------------------------------------------
grant select on public.orders, public.order_items, public.order_events to authenticated;

create policy "orders: read own or admin" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "order items: read own or admin" on public.order_items for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

create policy "order events: customer timeline or admin" on public.order_events for select to authenticated
  using (
    (select public.is_admin())
    or (not is_internal and exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())))
  );

-- ---------------------------------------------------------------------------
-- Wishlist: private to its owner.
-- ---------------------------------------------------------------------------
grant select, insert, delete on public.wishlist_items to authenticated;
create policy "wishlist: read own" on public.wishlist_items for select to authenticated using (user_id = (select auth.uid()));
create policy "wishlist: insert own" on public.wishlist_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "wishlist: delete own" on public.wishlist_items for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Reviews: approved reviews are public; customers who received a product can
-- submit one (moderated); admins moderate.
-- ---------------------------------------------------------------------------
grant select on public.reviews to anon, authenticated;
grant insert (product_id, author_name, city, rating, title, body) on public.reviews to authenticated;
grant update (status, moderated_at, moderated_by) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create policy "reviews: read approved, own or admin" on public.reviews for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews: verified customers insert" on public.reviews for insert to authenticated
  with check ((select public.has_purchased(product_id)));
create policy "reviews: admin moderate" on public.reviews for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "reviews: admin delete" on public.reviews for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Inbox & subscribers: written by the server, read by admins.
-- ---------------------------------------------------------------------------
grant select on public.contact_messages, public.newsletter_subscribers to authenticated;
grant update (status, handled_at, handled_by) on public.contact_messages to authenticated;

create policy "messages: admin read" on public.contact_messages for select to authenticated using ((select public.is_admin()));
create policy "messages: admin update" on public.contact_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "subscribers: admin read" on public.newsletter_subscribers for select to authenticated using ((select public.is_admin()));

grant select on public.audit_log to authenticated;
create policy "audit: admin read" on public.audit_log for select to authenticated using ((select public.is_admin()));

-- payment_events and rate_limits: no policies → service role only.

-- ---------------------------------------------------------------------------
-- Storage: public product images, admin-only writes.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "product images: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product images: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product images: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
