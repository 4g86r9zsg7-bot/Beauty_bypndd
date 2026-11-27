create or replace function public.admin_save_offer(
  p_offer jsonb,
  p_items jsonb,
  p_offer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if jsonb_typeof(p_offer) is distinct from 'object'
     or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) < 1 then
    raise exception 'Données de l’offre invalides';
  end if;

  if coalesce(nullif(pg_catalog.btrim(p_offer->>'title'),''),'') = '' then
    raise exception 'Le titre de l’offre est obligatoire';
  end if;

  if coalesce(p_offer->>'kind','') not in ('pack','buy_x_get_1','variant_discount') then
    raise exception 'Type d’offre invalide';
  end if;

  if p_offer->>'kind' = 'pack'
     and (nullif(p_offer->>'pack_price','') is null
          or (p_offer->>'pack_price')::numeric <= 0) then
    raise exception 'Prix du pack invalide';
  end if;

  if p_offer->>'kind' = 'variant_discount'
     and (nullif(p_offer->>'discount_value','') is null
          or (p_offer->>'discount_value')::numeric <= 0
          or (p_offer->>'discount_type' = 'percent'
              and (p_offer->>'discount_value')::numeric > 90)) then
    raise exception 'Réduction de variante invalide';
  end if;

  if nullif(p_offer->>'starts_at','') is not null
     and nullif(p_offer->>'ends_at','') is not null
     and (p_offer->>'ends_at')::timestamptz <= (p_offer->>'starts_at')::timestamptz then
    raise exception 'La date de fin doit être après la date de début';
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items)
  loop
    if nullif(v_item->>'product_id','') is null then
      raise exception 'Produit manquant dans l’offre';
    end if;
    v_qty := coalesce(nullif(v_item->>'qty','')::integer,1);
    if v_qty < 1 then raise exception 'Quantité de produit invalide'; end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if not found then raise exception 'Un produit de cette offre est introuvable'; end if;

    if p_offer->>'kind' in ('pack','variant_discount')
       and pg_catalog.jsonb_typeof(v_product.variants) = 'array'
       and pg_catalog.jsonb_array_length(coalesce(v_product.variants,'[]'::jsonb)) > 0
       and pg_catalog.jsonb_typeof(v_product.variants->0) = 'object'
       and nullif(v_item->>'variant','') is null then
      raise exception 'Une variante doit être choisie pour chaque produit concerné';
    end if;

    if nullif(v_item->>'variant','') is not null
       and not exists (
         select 1
         from pg_catalog.jsonb_array_elements(coalesce(v_product.variants,'[]'::jsonb)) v
         where case
           when pg_catalog.jsonb_typeof(v) = 'string' then v #>> '{}'
           when pg_catalog.jsonb_typeof(v) = 'object' then v->>'name'
           else null
         end = v_item->>'variant'
       ) then
      raise exception 'Une variante sélectionnée n’existe plus';
    end if;
  end loop;

  if p_offer_id is null then
    insert into public.offers (
      kind,title,slug,description,image_url,tag,pack_price,buy_qty,
      discount_type,discount_value,starts_at,ends_at,stock,active
    ) values (
      p_offer->>'kind',
      pg_catalog.btrim(p_offer->>'title'),
      p_offer->>'slug',
      nullif(p_offer->>'description',''),
      nullif(p_offer->>'image_url',''),
      nullif(p_offer->>'tag',''),
      nullif(p_offer->>'pack_price','')::numeric,
      nullif(p_offer->>'buy_qty','')::integer,
      coalesce(nullif(p_offer->>'discount_type',''),'percent'),
      nullif(p_offer->>'discount_value','')::numeric,
      nullif(p_offer->>'starts_at','')::timestamptz,
      nullif(p_offer->>'ends_at','')::timestamptz,
      nullif(p_offer->>'stock','')::integer,
      coalesce((p_offer->>'active')::boolean,true)
    ) returning id into v_id;
  else
    update public.offers set
      kind=p_offer->>'kind',
      title=pg_catalog.btrim(p_offer->>'title'),
      description=nullif(p_offer->>'description',''),
      image_url=nullif(p_offer->>'image_url',''),
      tag=nullif(p_offer->>'tag',''),
      pack_price=nullif(p_offer->>'pack_price','')::numeric,
      buy_qty=nullif(p_offer->>'buy_qty','')::integer,
      discount_type=coalesce(nullif(p_offer->>'discount_type',''),'percent'),
      discount_value=nullif(p_offer->>'discount_value','')::numeric,
      starts_at=nullif(p_offer->>'starts_at','')::timestamptz,
      ends_at=nullif(p_offer->>'ends_at','')::timestamptz,
      stock=nullif(p_offer->>'stock','')::integer,
      active=coalesce((p_offer->>'active')::boolean,true)
    where id=p_offer_id
    returning id into v_id;

    if v_id is null then raise exception 'Offre introuvable'; end if;
    delete from public.offer_items where offer_id=v_id;
  end if;

  if p_offer->>'kind' = 'pack'
     and (select coalesce(sum(greatest(1,coalesce(nullif(x->>'qty','')::integer,1))),0)
          from pg_catalog.jsonb_array_elements(p_items) x) < 2 then
    raise exception 'Un pack doit contenir au moins deux articles';
  end if;

  if p_offer->>'kind' = 'buy_x_get_1'
     and coalesce(nullif(p_offer->>'buy_qty','')::integer,0) < 1 then
    raise exception 'Quantité de produits achetés invalide';
  end if;

  if p_offer->>'kind' = 'variant_discount'
     and p_offer->>'discount_type' not in ('percent','amount') then
    raise exception 'Type de réduction invalide';
  end if;

  insert into public.offer_items(offer_id,product_id,variant,qty)
  select
    v_id,
    (x->>'product_id')::uuid,
    nullif(x->>'variant',''),
    case when p_offer->>'kind'='pack'
      then greatest(1,coalesce(nullif(x->>'qty','')::integer,1))
      else 1 end
  from pg_catalog.jsonb_array_elements(p_items) x;

  return v_id;
end;
$$;

revoke all on function public.admin_save_offer(jsonb,jsonb,uuid) from public, anon;
grant execute on function public.admin_save_offer(jsonb,jsonb,uuid) to authenticated;

alter table public.promo_codes
  add constraint promo_codes_kind_valid
  check (kind in ('percent','fixed')) not valid;
alter table public.promo_codes validate constraint promo_codes_kind_valid;

alter table public.promo_codes
  add constraint promo_codes_percent_valid
  check (kind <> 'percent' or (percent is not null and percent between 1 and 90)) not valid;
alter table public.promo_codes validate constraint promo_codes_percent_valid;

alter table public.promo_codes
  add constraint promo_codes_amount_valid
  check (kind <> 'fixed' or (amount is not null and amount > 0)) not valid;
alter table public.promo_codes validate constraint promo_codes_amount_valid;

alter table public.promo_codes
  add constraint promo_codes_max_uses_valid
  check (max_uses is null or max_uses >= 1) not valid;
alter table public.promo_codes validate constraint promo_codes_max_uses_valid;

alter table public.promo_codes
  add constraint promo_codes_dates_valid
  check (starts_at is null or expires_at is null or expires_at >= starts_at) not valid;
alter table public.promo_codes validate constraint promo_codes_dates_valid;
