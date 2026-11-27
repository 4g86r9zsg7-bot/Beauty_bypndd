-- Secure, order-scoped review links for delivered orders.
CREATE TABLE IF NOT EXISTS private.order_review_links (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.order_review_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.order_review_links FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_order_review_link(p_order_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_token text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_order_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.orders WHERE id=p_order_id AND status='delivered') THEN
    RAISE EXCEPTION 'Cette commande n’est pas livrée';
  END IF;
  v_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO private.order_review_links(order_id,token_hash,expires_at,created_at)
  VALUES(p_order_id,extensions.digest(pg_catalog.convert_to(v_token,'UTF8'),'sha256'),now()+interval '180 days',now())
  ON CONFLICT(order_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,created_at=EXCLUDED.created_at;
  RETURN v_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_review_link(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_order public.orders%rowtype; v_items json;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RETURN json_build_object('ok',false,'message','Lien invalide ou expiré.'); END IF;
  SELECT o.* INTO v_order FROM private.order_review_links l JOIN public.orders o ON o.id=l.order_id
  WHERE l.token_hash=extensions.digest(pg_catalog.convert_to(p_token,'UTF8'),'sha256') AND l.expires_at>now() AND o.status='delivered';
  IF NOT FOUND THEN RETURN json_build_object('ok',false,'message','Lien invalide ou expiré.'); END IF;
  SELECT coalesce(json_agg(json_build_object('id',x.product_id,'name',x.product_name,'reviewed',EXISTS(
    SELECT 1 FROM public.reviews r WHERE r.order_id=v_order.id AND r.product_id=x.product_id
  )) ORDER BY x.ordinality),'[]'::json) INTO v_items
  FROM (
    SELECT DISTINCT ON (i.value->>'id') (i.value->>'id')::uuid product_id,
      coalesce(nullif(i.value->>'name',''),'Article') product_name,i.ordinality
    FROM jsonb_array_elements(coalesce(v_order.items,'[]'::jsonb)) WITH ORDINALITY AS i(value,ordinality)
    WHERE i.value->>'id' ~* '^[0-9a-f-]{36}$'
    ORDER BY i.value->>'id',i.ordinality
  ) x;
  RETURN json_build_object('ok',true,'first_name',split_part(v_order.name,' ',1),'items',v_items);
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_order_review_link(p_token text,p_product uuid,p_rating integer,p_comment text DEFAULT '')
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_order public.orders%rowtype; v_name text;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR p_product IS NULL OR p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Avis invalide';
  END IF;
  SELECT o.* INTO v_order FROM private.order_review_links l JOIN public.orders o ON o.id=l.order_id
  WHERE l.token_hash=extensions.digest(pg_catalog.convert_to(p_token,'UTF8'),'sha256') AND l.expires_at>now() AND o.status='delivered'
  FOR UPDATE OF o;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lien invalide ou expiré'; END IF;
  SELECT coalesce(nullif(i.value->>'name',''),'Article') INTO v_name
  FROM jsonb_array_elements(coalesce(v_order.items,'[]'::jsonb)) i(value)
  WHERE i.value->>'id'=p_product::text LIMIT 1;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Produit absent de cette commande'; END IF;
  INSERT INTO public.reviews(product_id,order_id,order_number,customer_name,rating,comment)
  VALUES(p_product,v_order.id,v_order.number,split_part(v_order.name,' ',1),p_rating,nullif(left(trim(coalesce(p_comment,'')),1000),''))
  ON CONFLICT(order_id,product_id) DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vous avez déjà noté ce produit pour cette commande'; END IF;
  RETURN json_build_object('ok',true);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_order_review_link(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_order_review_link(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_order_review_link(text,uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_review_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_review_link(text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_review_link(text,uuid,integer,text) TO anon,authenticated;
