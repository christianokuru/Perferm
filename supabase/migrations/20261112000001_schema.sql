-- Perferm — core schema.
-- Money is integer kobo everywhere. Every table has RLS enabled (see the
-- policies migration); nothing here is reachable until explicitly granted.

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.product_gender as enum ('her', 'him', 'unisex');
create type public.product_concentration as enum ('extrait', 'edp', 'edt', 'attar', 'bakhoor', 'gift-set');
create type public.scent_family as enum ('woody', 'oriental', 'floral', 'fresh', 'gourmand', 'musky', 'citrus');
create type public.order_status as enum ('pending', 'paid', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'cancelled');
create type public.fulfilment_method as enum ('delivery', 'pickup');
create type public.payment_provider as enum ('paystack', 'flutterwave');
create type public.payment_mode as enum ('live', 'demo');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.message_status as enum ('new', 'handled', 'archived');
create type public.contact_topic as enum ('order', 'recommendation', 'wholesale', 'press', 'other');

-- Canonical Nigerian mobile number in E.164 (+234XXXXXXXXXX).
create domain public.ng_phone as text check (value ~ '^\+234[789][01][0-9]{8}$');

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email extensions.citext not null default '',
  full_name text not null default '' check (char_length(full_name) <= 80),
  phone public.ng_phone,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where role = 'admin';
create index profiles_created_idx on public.profiles (created_at desc);
create index profiles_search_idx on public.profiles
  using gin ((lower(full_name) || ' ' || lower(email::text)) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Store configuration
-- ---------------------------------------------------------------------------
create table public.delivery_zones (
  state text primary key check (char_length(state) between 2 and 40),
  fee_kobo integer not null check (fee_kobo between 0 and 100000000),
  eta text not null check (char_length(eta) between 2 and 40),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  store_name text not null check (char_length(store_name) between 2 and 60),
  support_email extensions.citext not null check (char_length(support_email) <= 254),
  support_phone text not null check (char_length(support_phone) between 7 and 20),
  announcement text not null default '' check (char_length(announcement) <= 120),
  pickup_enabled boolean not null default true,
  pickup_address text not null check (char_length(pickup_address) between 5 and 200),
  pickup_hours text not null check (char_length(pickup_hours) between 3 and 80),
  paystack_enabled boolean not null default true,
  flutterwave_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint at_least_one_gateway check (paystack_enabled or flutterwave_enabled)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 30),
  recipient text not null check (char_length(recipient) between 2 and 80),
  phone public.ng_phone not null,
  state text not null references public.delivery_zones (state) on update cascade,
  city text not null check (char_length(city) between 2 and 60),
  address text not null check (char_length(address) between 2 and 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id, created_at);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;
create index addresses_state_idx on public.addresses (state);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.collections (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title text not null check (char_length(title) between 2 and 80),
  accent text not null check (char_length(accent) between 1 and 40),
  eyebrow text not null check (char_length(eyebrow) between 1 and 60),
  description text not null check (char_length(description) between 10 and 600),
  image_src text not null check (image_src ~ '^https://'),
  image_alt text not null check (char_length(image_alt) <= 200),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 96),
  name text not null check (char_length(name) between 2 and 80),
  house text not null check (char_length(house) between 2 and 60),
  tagline text not null check (char_length(tagline) between 4 and 120),
  description text not null check (char_length(description) between 20 and 2000),
  gender public.product_gender not null,
  concentration public.product_concentration not null,
  families public.scent_family[] not null check (cardinality(families) between 1 and 7),
  notes_top text[] not null default '{}' check (cardinality(notes_top) <= 8),
  notes_heart text[] not null default '{}' check (cardinality(notes_heart) <= 8),
  notes_base text[] not null default '{}' check (cardinality(notes_base) <= 8),
  longevity text not null check (char_length(longevity) between 2 and 30),
  sillage text not null check (char_length(sillage) between 2 and 30),
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_active_idx on public.products (created_at desc) where archived_at is null;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  src text not null check (src ~ '^https://' and char_length(src) <= 1000),
  alt text not null check (char_length(alt) <= 200),
  storage_path text check (storage_path is null or char_length(storage_path) <= 300),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  price_kobo bigint not null check (price_kobo between 10000 and 5000000000),
  compare_at_kobo bigint check (compare_at_kobo is null or compare_at_kobo > price_kobo),
  stock integer not null default 0 check (stock between 0 and 100000),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_label_unique unique (product_id, label)
);
create index product_variants_product_idx on public.product_variants (product_id, position);
create index product_variants_low_stock_idx on public.product_variants (stock) where stock <= 5;

create table public.product_collections (
  product_id uuid not null references public.products (id) on delete cascade,
  collection_slug text not null references public.collections (slug) on update cascade on delete cascade,
  primary key (product_id, collection_slug)
);
create index product_collections_slug_idx on public.product_collections (collection_slug);

-- ---------------------------------------------------------------------------
-- Orders & payments
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^PF-[A-Z0-9]{8}$'),
  user_id uuid references public.profiles (id) on delete set null,
  email extensions.citext not null check (char_length(email) <= 254),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone public.ng_phone not null,
  fulfilment public.fulfilment_method not null,
  delivery_state text check (delivery_state is null or char_length(delivery_state) <= 40),
  delivery_city text check (delivery_city is null or char_length(delivery_city) <= 60),
  delivery_address text check (delivery_address is null or char_length(delivery_address) <= 200),
  delivery_notes text check (delivery_notes is null or char_length(delivery_notes) <= 300),
  pickup_location text check (pickup_location is null or char_length(pickup_location) <= 300),
  subtotal_kobo bigint not null check (subtotal_kobo > 0),
  delivery_fee_kobo bigint not null check (delivery_fee_kobo >= 0),
  total_kobo bigint not null,
  currency char(3) not null default 'NGN' check (currency = 'NGN'),
  status public.order_status not null default 'pending',
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 300),
  payment_provider public.payment_provider not null,
  payment_mode public.payment_mode not null,
  provider_transaction_id text check (provider_transaction_id is null or char_length(provider_transaction_id) <= 120),
  -- SHA-256 of the secret that lets a guest view their own order. The secret itself is never stored.
  access_key_hash text not null check (access_key_hash ~ '^[0-9a-f]{64}$'),
  stock_issue boolean not null default false,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total_kobo = subtotal_kobo + delivery_fee_kobo),
  constraint orders_fulfilment_details check (
    (fulfilment = 'pickup' and delivery_state is null and delivery_city is null and delivery_address is null)
    or (fulfilment = 'delivery' and delivery_state is not null and delivery_city is not null and delivery_address is not null)
  )
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_email_idx on public.orders (email);
create index orders_pending_idx on public.orders (created_at) where status = 'pending';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  product_slug text not null,
  house text not null,
  variant_label text not null,
  image_src text not null,
  unit_price_kobo bigint not null check (unit_price_kobo > 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_kobo bigint generated always as (unit_price_kobo * quantity) stored
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  kind text not null check (kind in ('created', 'status', 'payment', 'note', 'stock')),
  status public.order_status,
  message text check (message is null or char_length(message) <= 500),
  is_internal boolean not null default false,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);
create index order_events_actor_idx on public.order_events (actor_id);

-- Every inbound gateway event, de-duplicated on the provider's own id.
create table public.payment_events (
  id bigint generated always as identity primary key,
  provider public.payment_provider not null,
  event_key text not null check (char_length(event_key) <= 200),
  event_type text not null check (char_length(event_type) <= 80),
  reference text check (reference is null or char_length(reference) <= 120),
  outcome text check (outcome is null or char_length(outcome) <= 200),
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  constraint payment_events_unique unique (provider, event_key)
);
create index payment_events_reference_idx on public.payment_events (reference);

-- ---------------------------------------------------------------------------
-- Engagement
-- ---------------------------------------------------------------------------
create table public.wishlist_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index wishlist_items_product_idx on public.wishlist_items (product_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  author_name text not null check (char_length(author_name) between 2 and 80),
  city text check (city is null or char_length(city) <= 60),
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(title) between 2 and 80),
  body text not null check (char_length(body) between 10 and 1500),
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references public.profiles (id) on delete set null,
  constraint reviews_one_per_customer unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews (product_id, status, created_at desc);
create index reviews_status_idx on public.reviews (status, created_at desc);
create index reviews_user_idx on public.reviews (user_id);
create index reviews_moderator_idx on public.reviews (moderated_by);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email extensions.citext not null check (char_length(email) <= 254),
  topic public.contact_topic not null,
  message text not null check (char_length(message) between 10 and 2000),
  user_id uuid references public.profiles (id) on delete set null,
  status public.message_status not null default 'new',
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index contact_messages_user_idx on public.contact_messages (user_id);
create index contact_messages_handler_idx on public.contact_messages (handled_by);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique check (char_length(email) <= 254),
  source text not null default 'site' check (char_length(source) <= 40),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create index newsletter_subscribers_created_idx on public.newsletter_subscribers (created_at desc);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
-- Fixed-window counters shared by every server instance. Keys are hashed.
create unlogged table public.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (bucket, window_start)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  entity text not null check (char_length(entity) <= 40),
  entity_id text check (entity_id is null or char_length(entity_id) <= 120),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id);
create index store_settings_updated_by_idx on public.store_settings (updated_by);
