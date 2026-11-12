-- Perferm — atomic product save for the admin dashboard.
-- One transaction writes the product, its sizes, images and collections, so a
-- half-saved product can never reach the storefront.
create or replace function public.admin_save_product(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_base text := p ->> 'slug';
  v_slug text;
  v_n integer := 1;
  v_variant jsonb;
  v_position integer := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p -> 'variants') <> 'array' or jsonb_array_length(p -> 'variants') not between 1 and 6 then
    raise exception 'invalid_variants' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p -> 'images') <> 'array' or jsonb_array_length(p -> 'images') not between 1 and 6 then
    raise exception 'invalid_images' using errcode = 'P0001';
  end if;

  if v_id is null then
    -- New product: derive a unique slug (oud-al-layl, oud-al-layl-2, …).
    v_slug := v_base;
    while exists (select 1 from public.products where slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    insert into public.products (
      slug, name, house, tagline, description, gender, concentration, families,
      notes_top, notes_heart, notes_base, longevity, sillage, is_new, is_bestseller
    ) values (
      v_slug, p ->> 'name', p ->> 'house', p ->> 'tagline', p ->> 'description',
      (p ->> 'gender')::public.product_gender, (p ->> 'concentration')::public.product_concentration,
      array(select jsonb_array_elements_text(p -> 'families'))::public.scent_family[],
      array(select jsonb_array_elements_text(p -> 'notes_top')),
      array(select jsonb_array_elements_text(p -> 'notes_heart')),
      array(select jsonb_array_elements_text(p -> 'notes_base')),
      p ->> 'longevity', p ->> 'sillage', (p ->> 'is_new')::boolean, (p ->> 'is_bestseller')::boolean
    )
    returning id into v_id;
  else
    update public.products set
      name = p ->> 'name',
      house = p ->> 'house',
      tagline = p ->> 'tagline',
      description = p ->> 'description',
      gender = (p ->> 'gender')::public.product_gender,
      concentration = (p ->> 'concentration')::public.product_concentration,
      families = array(select jsonb_array_elements_text(p -> 'families'))::public.scent_family[],
      notes_top = array(select jsonb_array_elements_text(p -> 'notes_top')),
      notes_heart = array(select jsonb_array_elements_text(p -> 'notes_heart')),
      notes_base = array(select jsonb_array_elements_text(p -> 'notes_base')),
      longevity = p ->> 'longevity',
      sillage = p ->> 'sillage',
      is_new = (p ->> 'is_new')::boolean,
      is_bestseller = (p ->> 'is_bestseller')::boolean
    where id = v_id;
    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
  end if;

  -- Sizes: remove dropped ones, then upsert in display order. Order history keeps its own snapshot.
  delete from public.product_variants
  where product_id = v_id
    and id not in (
      select (x ->> 'id')::uuid from jsonb_array_elements(p -> 'variants') x where nullif(x ->> 'id', '') is not null
    );

  -- Park existing labels first so renames/swaps can't collide with the unique (product, label) constraint.
  update public.product_variants set label = left('~' || id::text, 20) where product_id = v_id;

  for v_variant in select * from jsonb_array_elements(p -> 'variants') loop
    if nullif(v_variant ->> 'id', '') is not null then
      update public.product_variants set
        label = v_variant ->> 'label',
        price_kobo = (v_variant ->> 'price_kobo')::bigint,
        compare_at_kobo = nullif(v_variant ->> 'compare_at_kobo', '')::bigint,
        stock = (v_variant ->> 'stock')::integer,
        position = v_position
      where id = (v_variant ->> 'id')::uuid and product_id = v_id;
      if not found then
        raise exception 'variant_not_found' using errcode = 'P0002';
      end if;
    else
      insert into public.product_variants (product_id, label, price_kobo, compare_at_kobo, stock, position)
      values (
        v_id, v_variant ->> 'label', (v_variant ->> 'price_kobo')::bigint,
        nullif(v_variant ->> 'compare_at_kobo', '')::bigint, (v_variant ->> 'stock')::integer, v_position
      );
    end if;
    v_position := v_position + 1;
  end loop;

  delete from public.product_images where product_id = v_id;
  insert into public.product_images (product_id, src, alt, storage_path, position)
  select v_id, x.value ->> 'src', left(coalesce(x.value ->> 'alt', ''), 200), nullif(x.value ->> 'storage_path', ''), (x.ordinality - 1)::smallint
  from jsonb_array_elements(p -> 'images') with ordinality as x(value, ordinality);

  delete from public.product_collections where product_id = v_id;
  insert into public.product_collections (product_id, collection_slug)
  select v_id, c.slug
  from public.collections c
  where c.slug in (select jsonb_array_elements_text(coalesce(p -> 'collections', '[]'::jsonb)));

  perform public.write_audit(case when nullif(p ->> 'id', '') is null then 'product.create' else 'product.update' end, 'product', v_id::text, '{}'::jsonb);
  return v_id;
end;
$$;

revoke execute on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;
