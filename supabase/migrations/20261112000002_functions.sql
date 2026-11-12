-- Perferm — functions & triggers.
-- SECURITY DEFINER functions always pin `search_path = ''` and fully qualify
-- every object, so they can't be hijacked through the search path.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when the caller is a signed-in admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- '0801 234 5678' | '+2348012345678' | '2348012345678' → '+2348012345678', else null.
create or replace function public.normalize_phone(raw text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(raw, ''), '[^0-9+]', '', 'g');
begin
  if digits ~ '^0[789][01][0-9]{8}$' then
    digits := '+234' || substr(digits, 2);
  elsif digits ~ '^234[789][01][0-9]{8}$' then
    digits := '+' || digits;
  end if;
  if digits ~ '^\+234[789][01][0-9]{8}$' then
    return digits;
  end if;
  return null;
end;
$$;

-- Strips control characters and angle brackets from free text coming from auth metadata.
create or replace function public.clean_text(raw text, max_length integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(btrim(regexp_replace(coalesce(raw, ''), '[[:cntrl:]<>]', '', 'g')), max_length);
$$;

create or replace function public.write_audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- Profiles (mirrors auth.users)
-- ---------------------------------------------------------------------------
-- Role is ALWAYS 'customer' here: nothing a user sends at sign-up can grant admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    public.clean_text(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 80),
    public.normalize_phone(new.raw_user_meta_data ->> 'phone')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Addresses: max 10, exactly one default
-- ---------------------------------------------------------------------------
create or replace function public.addresses_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.addresses where user_id = new.user_id) >= 10 then
      raise exception 'address_limit' using errcode = 'P0001', hint = 'You can save up to 10 addresses.';
    end if;
    if not exists (select 1 from public.addresses where user_id = new.user_id) then
      new.is_default := true;
    end if;
  else
    new.user_id := old.user_id; -- ownership can never move
    new.updated_at := now();
  end if;

  if new.is_default then
    update public.addresses set is_default = false
    where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger addresses_before_write before insert or update on public.addresses
  for each row execute function public.addresses_before_write();

create or replace function public.addresses_after_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default then
    update public.addresses set is_default = true
    where id = (
      select id from public.addresses where user_id = old.user_id order by created_at desc limit 1
    );
  end if;
  return old;
end;
$$;

create trigger addresses_after_delete after delete on public.addresses
  for each row execute function public.addresses_after_delete();

-- ---------------------------------------------------------------------------
-- Wishlist: max 100 per customer
-- ---------------------------------------------------------------------------
create or replace function public.wishlist_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.wishlist_items where user_id = new.user_id) >= 100 then
    raise exception 'wishlist_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger wishlist_before_insert before insert on public.wishlist_items
  for each row execute function public.wishlist_before_insert();

-- ---------------------------------------------------------------------------
-- Catalogue timestamps
-- ---------------------------------------------------------------------------
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();
create trigger delivery_zones_touch before update on public.delivery_zones
  for each row execute function public.touch_updated_at();
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Reviews: verified purchasers only, moderated, ratings derived
-- ---------------------------------------------------------------------------
create or replace function public.has_purchased(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = (select auth.uid())
      and oi.product_id = p_product_id
      and o.status = 'delivered'
  );
$$;

create or replace function public.reviews_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Customers can't self-approve or claim a purchase; only admins/service may seed reviews.
  if (select auth.role()) = 'authenticated' and not public.is_admin() then
    new.user_id := (select auth.uid());
    new.status := 'pending';
    new.verified_purchase := public.has_purchased(new.product_id);
    new.moderated_at := null;
    new.moderated_by := null;
    new.created_at := now();
  end if;
  new.author_name := public.clean_text(new.author_name, 80);
  new.city := nullif(public.clean_text(new.city, 60), '');
  new.title := public.clean_text(new.title, 80);
  return new;
end;
$$;

create trigger reviews_before_insert before insert on public.reviews
  for each row execute function public.reviews_before_insert();

create or replace function public.refresh_product_rating(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1) from public.reviews r
        where r.product_id = p_product_id and r.status = 'approved'
      ), 0),
      review_count = (
        select count(*) from public.reviews r
        where r.product_id = p_product_id and r.status = 'approved'
      )
  where p.id = p_product_id;
$$;

create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_product_rating(old.product_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.product_id <> old.product_id) then
    perform public.refresh_product_rating(new.product_id);
  end if;
  return null;
end;
$$;

create trigger reviews_after_change after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
-- Inserts an order and its lines atomically. Prices and the delivery fee are
-- re-checked against the live catalogue inside the same transaction, so a
-- tampered payload can never create an under-priced order. Service role only.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns table (id uuid, reference text, total_kobo bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_subtotal bigint;
  v_fee bigint := 0;
  v_mismatch integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'invalid_items' using errcode = 'P0001';
  end if;

  -- Every line must match a live variant at its current price with enough stock.
  select count(*) into v_mismatch
  from jsonb_to_recordset(p_items) as x(variant_id uuid, unit_price_kobo bigint, quantity integer)
  left join public.product_variants v on v.id = x.variant_id
  left join public.products p on p.id = v.product_id
  where v.id is null
     or p.archived_at is not null
     or v.price_kobo <> x.unit_price_kobo
     or x.quantity not between 1 and 10
     or v.stock < x.quantity;
  if v_mismatch > 0 then
    raise exception 'price_or_stock_changed' using errcode = 'P0001';
  end if;

  select sum(x.unit_price_kobo * x.quantity) into v_subtotal
  from jsonb_to_recordset(p_items) as x(unit_price_kobo bigint, quantity integer);

  if (p_order ->> 'fulfilment') = 'delivery' then
    select z.fee_kobo into v_fee from public.delivery_zones z
    where z.state = p_order ->> 'delivery_state' and z.is_active;
    if not found then
      raise exception 'zone_unavailable' using errcode = 'P0001';
    end if;
  elsif not (select s.pickup_enabled from public.store_settings s where s.id = 1) then
    raise exception 'pickup_unavailable' using errcode = 'P0001';
  end if;

  if v_subtotal <> (p_order ->> 'subtotal_kobo')::bigint or v_fee <> (p_order ->> 'delivery_fee_kobo')::bigint then
    raise exception 'totals_mismatch' using errcode = 'P0001';
  end if;

  insert into public.orders (
    reference, user_id, email, customer_name, phone, fulfilment,
    delivery_state, delivery_city, delivery_address, delivery_notes, pickup_location,
    subtotal_kobo, delivery_fee_kobo, total_kobo,
    payment_provider, payment_mode, access_key_hash
  ) values (
    p_order ->> 'reference',
    nullif(p_order ->> 'user_id', '')::uuid,
    p_order ->> 'email',
    p_order ->> 'customer_name',
    p_order ->> 'phone',
    (p_order ->> 'fulfilment')::public.fulfilment_method,
    nullif(p_order ->> 'delivery_state', ''),
    nullif(p_order ->> 'delivery_city', ''),
    nullif(p_order ->> 'delivery_address', ''),
    nullif(p_order ->> 'delivery_notes', ''),
    nullif(p_order ->> 'pickup_location', ''),
    v_subtotal, v_fee, v_subtotal + v_fee,
    (p_order ->> 'payment_provider')::public.payment_provider,
    (p_order ->> 'payment_mode')::public.payment_mode,
    p_order ->> 'access_key_hash'
  )
  returning * into v_order;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, product_slug, house, variant_label, image_src, unit_price_kobo, quantity
  )
  select v_order.id, p.id, v.id, p.name, p.slug, p.house, v.label,
         coalesce((select i.src from public.product_images i where i.product_id = p.id order by i.position limit 1), ''),
         v.price_kobo, x.quantity
  from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer)
  join public.product_variants v on v.id = x.variant_id
  join public.products p on p.id = v.product_id;

  insert into public.order_events (order_id, kind, status, message)
  values (v_order.id, 'created', 'pending', 'Order placed — awaiting payment');

  return query select v_order.id, v_order.reference, v_order.total_kobo;
end;
$$;

-- Marks an order paid exactly once and decrements stock in the same
-- transaction. Safe to call repeatedly (redirect + webhook race). Service role only.
create or replace function public.confirm_order_payment(
  p_reference text,
  p_provider public.payment_provider,
  p_mode public.payment_mode,
  p_amount_kobo bigint,
  p_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
  v_short boolean := false;
  v_stock integer;
begin
  select * into v_order from public.orders where reference = p_reference for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_order.status <> 'pending' and not (v_order.status = 'cancelled' and v_order.cancel_reason = 'expired') then
    return jsonb_build_object('ok', true, 'already', true, 'order_id', v_order.id, 'status', v_order.status);
  end if;

  if v_order.payment_provider <> p_provider or v_order.payment_mode <> p_mode then
    return jsonb_build_object('ok', false, 'reason', 'provider_mismatch');
  end if;

  if p_amount_kobo <> v_order.total_kobo then
    insert into public.order_events (order_id, kind, message, is_internal)
    values (v_order.id, 'payment', format('Payment amount mismatch: received %s kobo, expected %s', p_amount_kobo, v_order.total_kobo), true);
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
  end if;

  -- Lock variant rows in a stable order to avoid deadlocks between concurrent payments.
  for v_item in
    select oi.variant_id, oi.quantity, oi.product_name, oi.variant_label
    from public.order_items oi
    where oi.order_id = v_order.id and oi.variant_id is not null
    order by oi.variant_id
  loop
    select stock into v_stock from public.product_variants where id = v_item.variant_id for update;
    if v_stock is null or v_stock < v_item.quantity then
      v_short := true;
      insert into public.order_events (order_id, kind, message, is_internal)
      values (v_order.id, 'stock', format('Oversold: %s (%s) — %s ordered, %s in stock', v_item.product_name, v_item.variant_label, v_item.quantity, coalesce(v_stock, 0)), true);
    end if;
    update public.product_variants set stock = greatest(stock - v_item.quantity, 0) where id = v_item.variant_id;
  end loop;

  update public.orders
  set status = 'paid',
      paid_at = now(),
      provider_transaction_id = left(p_transaction_id, 120),
      cancel_reason = null,
      cancelled_at = null,
      stock_issue = v_short
  where id = v_order.id;

  insert into public.order_events (order_id, kind, status, message)
  values (v_order.id, 'payment', 'paid', 'Payment confirmed');

  return jsonb_build_object('ok', true, 'already', false, 'order_id', v_order.id, 'status', 'paid', 'stock_issue', v_short);
end;
$$;

-- Admin-only status changes with an enforced state machine. Paid is never
-- set by hand: only a verified payment can do that.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_allowed public.order_status[];
  v_note text := nullif(public.clean_text(p_note, 300), '');
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_order.status = p_status then
    return v_order;
  end if;

  v_allowed := case v_order.status
    when 'pending' then array['cancelled']::public.order_status[]
    when 'paid' then case v_order.fulfilment
      when 'delivery' then array['processing', 'shipped', 'cancelled']::public.order_status[]
      else array['processing', 'ready_for_pickup', 'cancelled']::public.order_status[] end
    when 'processing' then case v_order.fulfilment
      when 'delivery' then array['shipped', 'cancelled']::public.order_status[]
      else array['ready_for_pickup', 'cancelled']::public.order_status[] end
    when 'shipped' then array['delivered']::public.order_status[]
    when 'ready_for_pickup' then array['delivered', 'cancelled']::public.order_status[]
    else array[]::public.order_status[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'invalid_transition' using errcode = 'P0001',
      hint = format('%s → %s is not allowed', v_order.status, p_status);
  end if;

  -- Cancelling a paid order that never left the boutique returns its stock.
  if p_status = 'cancelled' and v_order.status in ('paid', 'processing', 'ready_for_pickup') then
    update public.product_variants v
    set stock = least(v.stock + oi.quantity, 100000)
    from public.order_items oi
    where oi.order_id = v_order.id and oi.variant_id = v.id;
    insert into public.order_events (order_id, kind, message, is_internal, actor_id)
    values (v_order.id, 'stock', 'Stock returned to inventory', true, (select auth.uid()));
  end if;

  update public.orders
  set status = p_status,
      shipped_at = case when p_status = 'shipped' then now() else shipped_at end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      cancel_reason = case when p_status = 'cancelled' then coalesce(v_note, 'Cancelled by the boutique') else cancel_reason end
  where id = v_order.id
  returning * into v_order;

  insert into public.order_events (order_id, kind, status, actor_id)
  values (v_order.id, 'status', p_status, (select auth.uid()));
  if v_note is not null then
    insert into public.order_events (order_id, kind, message, is_internal, actor_id)
    values (v_order.id, 'note', v_note, true, (select auth.uid()));
  end if;

  perform public.write_audit('order.status', 'order', v_order.reference, jsonb_build_object('status', p_status));
  return v_order;
end;
$$;

create or replace function public.admin_add_order_note(p_order_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text := nullif(public.clean_text(p_note, 500), '');
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_note is null then
    raise exception 'empty_note' using errcode = 'P0001';
  end if;
  insert into public.order_events (order_id, kind, message, is_internal, actor_id)
  values (p_order_id, 'note', v_note, true, (select auth.uid()));
end;
$$;

-- Releases abandoned checkouts. Runs on a schedule (pg_cron).
create or replace function public.expire_pending_orders(p_older_than interval default interval '3 hours')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.orders
    set status = 'cancelled', cancel_reason = 'expired', cancelled_at = now()
    where status = 'pending' and created_at < now() - p_older_than
    returning id
  ), events as (
    insert into public.order_events (order_id, kind, status, message)
    select id, 'status', 'cancelled', 'Payment was not completed — order released' from expired
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window, shared across instances). Service role only.
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_hit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits (bucket, window_start, hits)
  values (left(p_bucket, 200), v_window, 1)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

-- ---------------------------------------------------------------------------
-- Admin reporting
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with sold as (
    select * from public.orders where status in ('paid', 'processing', 'shipped', 'ready_for_pickup', 'delivered')
  )
  select jsonb_build_object(
    'revenue_kobo', coalesce((select sum(total_kobo) from sold), 0),
    'orders', (select count(*) from sold),
    'revenue_30d_kobo', coalesce((select sum(total_kobo) from sold where paid_at > now() - interval '30 days'), 0),
    'orders_30d', (select count(*) from sold where paid_at > now() - interval '30 days'),
    'to_fulfil', (select count(*) from public.orders where status in ('paid', 'processing')),
    'pending_payment', (select count(*) from public.orders where status = 'pending'),
    'stock_issues', (select count(*) from public.orders where stock_issue and status not in ('delivered', 'cancelled')),
    'customers', (select count(*) from public.profiles where role = 'customer'),
    'products', (select count(*) from public.products where archived_at is null),
    'new_messages', (select count(*) from public.contact_messages where status = 'new'),
    'pending_reviews', (select count(*) from public.reviews where status = 'pending'),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'revenue_kobo', d.revenue, 'orders', d.orders) order by d.day)
      from (
        select g.day::date as day,
               coalesce(sum(s.total_kobo), 0) as revenue,
               count(s.id) as orders
        from generate_series((now() - interval '13 days')::date, now()::date, interval '1 day') as g(day)
        left join sold s on s.paid_at::date = g.day::date
        group by g.day
      ) d
    ), '[]'::jsonb),
    'low_stock', coalesce((
      select jsonb_agg(row_to_json(l)) from (
        select p.id as product_id, p.name, v.label, v.stock
        from public.product_variants v join public.products p on p.id = v.product_id
        where p.archived_at is null and v.stock <= 5
        order by v.stock, p.name limit 8
      ) l
    ), '[]'::jsonb),
    'top_sellers', coalesce((
      select jsonb_agg(row_to_json(t)) from (
        select oi.product_name as name, sum(oi.quantity)::integer as quantity, sum(oi.line_total_kobo)::bigint as revenue_kobo
        from public.order_items oi join sold s on s.id = oi.order_id
        group by oi.product_name order by sum(oi.quantity) desc limit 5
      ) t
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_customers(p_search text default null, p_limit integer default 25, p_offset integer default 0)
returns table (
  id uuid, email text, full_name text, phone text, role public.user_role, created_at timestamptz,
  order_count bigint, total_spent_kobo bigint, total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := lower(nullif(btrim(left(coalesce(p_search, ''), 80)), ''));
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with matched as (
    select p.* from public.profiles p
    where v_search is null
       or strpos(lower(p.full_name) || ' ' || lower(p.email::text), v_search) > 0
       or strpos(coalesce(p.phone, ''), v_search) > 0
  )
  select m.id, m.email::text, m.full_name, m.phone::text, m.role, m.created_at,
         count(o.id) filter (where o.status not in ('pending', 'cancelled')),
         coalesce(sum(o.total_kobo) filter (where o.status not in ('pending', 'cancelled')), 0)::bigint,
         count(*) over ()
  from matched m
  left join public.orders o on o.user_id = m.id
  group by m.id, m.email, m.full_name, m.phone, m.role, m.created_at
  order by m.created_at desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot_change_own_role' using errcode = 'P0001';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  perform public.write_audit('user.role', 'profile', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;
