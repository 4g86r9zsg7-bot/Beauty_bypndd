-- Bind guest favorites and notifications to an unguessable browser UUID,
-- and require an order's phone + access code to claim legacy notifications.
-- No existing customer rows are deleted.

DO $migration_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.favorites) THEN
    RAISE EXCEPTION 'Legacy favorites exist; migrate them with an owner-verified flow before applying this migration.';
  END IF;
  IF EXISTS (SELECT 1 FROM private.restock_alerts) THEN
    RAISE EXCEPTION 'Legacy restock alerts exist; associate them with verified client keys before applying this migration.';
  END IF;
END;
$migration_guard$;

-- Legacy notifications without an order access hash cannot be claimed safely
-- by phone alone. Keep them untouched and report their count during rollout.
DO $legacy_notification_notice$
DECLARE
  v_unclaimed_notifications bigint;
  v_unclaimed_orders bigint;
BEGIN
  SELECT count(*), count(DISTINCT n.order_id)
    INTO v_unclaimed_notifications, v_unclaimed_orders
    FROM public.notifications AS n
    LEFT JOIN private.order_access AS oa ON oa.order_id = n.order_id
   WHERE n.order_id IS NOT NULL
     AND oa.order_id IS NULL;

  IF v_unclaimed_notifications > 0 THEN
    RAISE NOTICE '% notifications across % orders have no stored access code. They remain preserved but cannot be claimed through the secure guest portal using a phone number alone.',
      v_unclaimed_notifications, v_unclaimed_orders;
  END IF;
END;
$legacy_notification_notice$;

ALTER TABLE private.restock_alerts
  ADD COLUMN IF NOT EXISTS client_key_hash bytea;

-- The order-access table contains only hashed order access codes.
-- Keep it inaccessible to API roles; SECURITY DEFINER RPCs owned by postgres
-- continue to access it without exposing rows through the client API.
ALTER TABLE private.order_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.order_access FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.client_favorites (
  client_key_hash bytea NOT NULL CHECK (octet_length(client_key_hash) = 32),
  product_id uuid NOT NULL REFERENCES public.products(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_key_hash, product_id)
);
CREATE TABLE IF NOT EXISTS private.order_notification_clients (
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_key_hash bytea NOT NULL CHECK (octet_length(client_key_hash) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, client_key_hash)
);
CREATE TABLE IF NOT EXISTS private.notification_clients (
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  client_key_hash bytea NOT NULL CHECK (octet_length(client_key_hash) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, client_key_hash)
);
ALTER TABLE private.client_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.order_notification_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.notification_clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.client_favorites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.order_notification_clients FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.notification_clients FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS notification_clients_client_key_idx
  ON private.notification_clients (client_key_hash, notification_id);
CREATE UNIQUE INDEX IF NOT EXISTS restock_alerts_client_key_product_variant_uidx
  ON private.restock_alerts
    (client_key_hash, product_id, (coalesce(variant_name, '')))
  WHERE client_key_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION private.map_notification_clients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.order_id IS NOT NULL THEN
    INSERT INTO private.notification_clients (notification_id, client_key_hash)
    SELECT NEW.id, c.client_key_hash
      FROM private.order_notification_clients AS c
     WHERE c.order_id = NEW.order_id
    ON CONFLICT DO NOTHING;
  ELSIF NEW.notification_type = 'restock' AND NEW.product_id IS NOT NULL THEN
    INSERT INTO private.notification_clients (notification_id, client_key_hash)
    SELECT NEW.id, ra.client_key_hash
      FROM private.restock_alerts AS ra
     WHERE ra.phone_key = NEW.phone_key
       AND ra.product_id = NEW.product_id
       AND ra.client_key_hash IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS map_notification_clients ON public.notifications;
CREATE TRIGGER map_notification_clients
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION private.map_notification_clients();

CREATE OR REPLACE FUNCTION private.validate_guest_cart(p_items jsonb, p_allow_empty boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_item jsonb;
  v_qty numeric;
  v_total numeric := 0;
BEGIN
  IF p_items IS NULL OR pg_catalog.jsonb_typeof(p_items) <> 'array'
     OR pg_catalog.jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Panier invalide';
  END IF;
  IF NOT p_allow_empty AND pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;

  FOR v_item IN SELECT value FROM pg_catalog.jsonb_array_elements(p_items)
  LOOP
    IF pg_catalog.jsonb_typeof(v_item) <> 'object'
       OR pg_catalog.jsonb_typeof(v_item->'qty') <> 'number' THEN
      RAISE EXCEPTION 'Article invalide';
    END IF;
    v_qty := (v_item->>'qty')::numeric;
    IF v_qty <> pg_catalog.trunc(v_qty) OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'Quantité invalide';
    END IF;
    v_total := v_total + v_qty;
    IF v_total > 500 THEN
      RAISE EXCEPTION 'Le panier dépasse la quantité maximale autorisée';
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quote_cart_secure(p_items jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM private.validate_guest_cart(p_items, true);
  RETURN public.quote_cart(p_items);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_promo_secure(
  p_code text,
  p_sub numeric,
  p_phone text,
  p_items jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_digits text;
BEGIN
  PERFORM private.validate_guest_cart(p_items, true);
  v_digits := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF p_code IS NULL OR pg_catalog.length(pg_catalog.trim(p_code)) NOT BETWEEN 1 AND 64
     OR pg_catalog.length(v_digits) NOT BETWEEN 8 AND 15
     OR p_sub IS NULL OR p_sub < 0 OR p_sub > 10000000 THEN
    RETURN pg_catalog.json_build_object('ok', false, 'message', 'Code promo ou panier invalide');
  END IF;
  RETURN public.promo_calc_target(p_code, p_sub, p_phone, p_items);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_favorites(p_client_key uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT coalesce(json_agg(cf.product_id), '[]'::json)
    FROM private.client_favorites AS cf
   WHERE cf.client_key_hash = extensions.digest(
     pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
   );
$function$;

CREATE OR REPLACE FUNCTION public.toggle_favorite(
  p_client_key uuid,
  p_product uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_key_hash bytea;
BEGIN
  IF p_client_key IS NULL OR p_product IS NULL THEN
    RAISE EXCEPTION 'Requête invalide';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products AS p
     WHERE p.id = p_product AND p.active = true
  ) THEN
    RAISE EXCEPTION 'Produit indisponible';
  END IF;

  v_key_hash := extensions.digest(
    pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(pg_catalog.encode(v_key_hash, 'hex') || p_product::text, 0)
  );

  DELETE FROM private.client_favorites AS cf
   WHERE cf.client_key_hash = v_key_hash
     AND cf.product_id = p_product;
  IF FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO private.client_favorites (client_key_hash, product_id)
  VALUES (v_key_hash, p_product);
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_notifications(p_client_key uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT coalesce(json_agg(x ORDER BY x.created_at DESC), '[]'::json)
    FROM (
      SELECT n.id, n.order_number, n.title, n.body, n.read, n.created_at,
             n.notification_type, n.product_id, n.product_slug
        FROM public.notifications AS n
       JOIN private.notification_clients AS nc ON nc.notification_id = n.id
       WHERE nc.client_key_hash = extensions.digest(
         pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
       )
       ORDER BY n.created_at DESC
       LIMIT 50
    ) AS x;
$function$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  p_client_key uuid,
  p_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.notifications AS n
     SET read = true
   WHERE EXISTS (
     SELECT 1 FROM private.notification_clients AS nc
      WHERE nc.notification_id = n.id
        AND nc.client_key_hash = extensions.digest(
          pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
        )
   )
     AND (p_id IS NULL OR n.id = p_id);
$function$;

CREATE OR REPLACE FUNCTION public.claim_order_notifications(
  p_phone text,
  p_access_code text,
  p_client_key uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_digits text;
  v_code_hash bytea;
  v_key_hash bytea;
  v_order_id uuid;
  v_count integer;
BEGIN
  v_digits := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF p_client_key IS NULL OR pg_catalog.length(v_digits) < 8
     OR pg_catalog.length(pg_catalog.trim(coalesce(p_access_code, ''))) <> 24 THEN
    RAISE EXCEPTION 'Code ou commande invalide';
  END IF;

  v_code_hash := extensions.digest(
    pg_catalog.convert_to(pg_catalog.upper(pg_catalog.trim(p_access_code)), 'UTF8'),
    'sha256'
  );
  v_key_hash := extensions.digest(
    pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
  );

  SELECT oa.order_id
    INTO v_order_id
    FROM private.order_access AS oa
    JOIN public.orders AS o ON o.id = oa.order_id
   WHERE oa.code_hash = v_code_hash
     AND pg_catalog.right(
           pg_catalog.regexp_replace(o.phone, '[^0-9]', '', 'g'), 9
         ) = pg_catalog.right(v_digits, 9)
   FOR UPDATE OF oa;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code ou commande invalide';
  END IF;

  -- Possession of the existing order code allows the customer to bind or move
  -- that order's guest notifications to this browser without exposing them by phone.
  INSERT INTO private.order_notification_clients (order_id, client_key_hash)
  VALUES (v_order_id, v_key_hash)
  ON CONFLICT DO NOTHING;
  INSERT INTO private.notification_clients (notification_id, client_key_hash)
  SELECT n.id, v_key_hash
    FROM public.notifications AS n
   WHERE n.order_id = v_order_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.subscribe_restock_alert(
  p_phone text,
  p_product uuid,
  p_variant text,
  p_client_key uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_phone text;
  v_variant text;
  v_variants jsonb;
  v_key_hash bytea;
  v_inserted integer;
BEGIN
  v_phone := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF p_client_key IS NULL OR pg_catalog.length(v_phone) < 8 OR p_product IS NULL THEN
    RAISE EXCEPTION 'Requête invalide';
  END IF;

  v_variant := nullif(pg_catalog.trim(coalesce(p_variant, '')), '');
  SELECT p.variants INTO v_variants
    FROM public.products AS p
   WHERE p.id = p_product AND p.active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit indisponible';
  END IF;

  IF v_variant IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM pg_catalog.jsonb_array_elements(coalesce(v_variants, '[]'::jsonb)) AS item(value)
     WHERE (pg_catalog.jsonb_typeof(item.value) = 'object' AND item.value->>'name' = v_variant)
        OR (pg_catalog.jsonb_typeof(item.value) = 'string' AND item.value #>> '{}' = v_variant)
  ) THEN
    RAISE EXCEPTION 'Variante introuvable';
  END IF;

  v_key_hash := extensions.digest(
    pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'
  );
  INSERT INTO private.restock_alerts (phone_key, product_id, variant_name, client_key_hash)
  VALUES (pg_catalog.right(v_phone, 9), p_product, v_variant, v_key_hash)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.place_order_secure(
  p_c jsonb,
  p_items jsonb,
  p_promo text,
  p_client_key uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order json;
  v_code text;
  v_order_id uuid;
BEGIN
  IF p_client_key IS NULL THEN
    RAISE EXCEPTION 'Session client invalide';
  END IF;
  PERFORM private.validate_guest_cart(p_items, false);
  v_order := public.place_order_secure(p_c, p_items, p_promo);
  v_code := v_order->>'access_code';
  SELECT oa.order_id INTO v_order_id
    FROM private.order_access AS oa
   WHERE oa.code_hash = extensions.digest(
     pg_catalog.convert_to(pg_catalog.upper(pg_catalog.trim(v_code)), 'UTF8'),
     'sha256'
   );
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Impossible de lier les notifications à cette session';
  END IF;
  INSERT INTO private.order_notification_clients (order_id, client_key_hash)
  VALUES (v_order_id, extensions.digest(pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'))
  ON CONFLICT DO NOTHING;
  INSERT INTO private.notification_clients (notification_id, client_key_hash)
  SELECT n.id, extensions.digest(pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256')
    FROM public.notifications AS n
   WHERE n.order_id = v_order_id
  ON CONFLICT DO NOTHING;
  RETURN v_order;
END;
$function$;

CREATE OR REPLACE FUNCTION public.place_order2_secure(
  p_c jsonb,
  p_items jsonb,
  p_promo text,
  p_client_key uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_order json;
  v_code text;
  v_order_id uuid;
BEGIN
  IF p_client_key IS NULL THEN
    RAISE EXCEPTION 'Session client invalide';
  END IF;
  PERFORM private.validate_guest_cart(p_items, false);
  v_order := public.place_order2_secure(p_c, p_items, p_promo);
  v_code := v_order->>'access_code';
  SELECT oa.order_id INTO v_order_id
    FROM private.order_access AS oa
   WHERE oa.code_hash = extensions.digest(
     pg_catalog.convert_to(pg_catalog.upper(pg_catalog.trim(v_code)), 'UTF8'),
     'sha256'
   );
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Impossible de lier les notifications à cette session';
  END IF;
  INSERT INTO private.order_notification_clients (order_id, client_key_hash)
  VALUES (v_order_id, extensions.digest(pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256'))
  ON CONFLICT DO NOTHING;
  INSERT INTO private.notification_clients (notification_id, client_key_hash)
  SELECT n.id, extensions.digest(pg_catalog.convert_to(p_client_key::text, 'UTF8'), 'sha256')
    FROM public.notifications AS n
   WHERE n.order_id = v_order_id
  ON CONFLICT DO NOTHING;
  RETURN v_order;
END;
$function$;

-- Internal helpers are callable only by their SECURITY DEFINER owners and trigger execution.
REVOKE ALL ON FUNCTION private.map_notification_clients() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_guest_cart(jsonb, boolean) FROM PUBLIC, anon, authenticated;

-- Keep public storefront RPCs available only to the API roles that need them.
REVOKE ALL ON FUNCTION public.get_favorites(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_favorites(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_favorite(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_favorite(uuid, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_notifications(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_notifications(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(uuid, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_order_notifications(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_order_notifications(text, text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.subscribe_restock_alert(text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_restock_alert(text, uuid, text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order_secure(jsonb, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_secure(jsonb, jsonb, text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order2_secure(jsonb, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order2_secure(jsonb, jsonb, text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.quote_cart_secure(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quote_cart_secure(jsonb) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.check_promo_secure(text, numeric, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_promo_secure(text, numeric, text, jsonb) TO anon, authenticated;


