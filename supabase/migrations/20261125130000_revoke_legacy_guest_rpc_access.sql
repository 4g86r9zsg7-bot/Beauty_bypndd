-- Remove phone-only guest RPC entry points after the client-key RPCs exist.
-- SECURITY DEFINER wrappers created by the previous migration continue to call
-- their legacy helpers as the postgres function owner.
DO $preflight$
BEGIN
  IF to_regprocedure('public.get_favorites(uuid)') IS NULL
     OR to_regprocedure('public.toggle_favorite(uuid,uuid)') IS NULL
     OR to_regprocedure('public.get_notifications(uuid)') IS NULL
     OR to_regprocedure('public.mark_notifications_read(uuid,uuid)') IS NULL
     OR to_regprocedure('public.claim_order_notifications(text,text,uuid)') IS NULL
     OR to_regprocedure('public.subscribe_restock_alert(text,uuid,text,uuid)') IS NULL
     OR to_regprocedure('public.place_order_secure(jsonb,jsonb,text,uuid)') IS NULL
     OR to_regprocedure('public.place_order2_secure(jsonb,jsonb,text,uuid)') IS NULL
     OR to_regprocedure('public.quote_cart_secure(jsonb)') IS NULL
     OR to_regprocedure('public.check_promo_secure(text,numeric,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'Secure guest RPCs are missing. Apply and verify 20261125120000_secure_guest_client_access.sql first.';
  END IF;
END;
$preflight$;

-- Favorites and notifications must never be scoped by a phone number alone.
REVOKE ALL ON FUNCTION public.get_favorites(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_favorite(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_notifications(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read(text, uuid) FROM PUBLIC, anon, authenticated;

-- New restock subscriptions must carry the unguessable browser client key.
REVOKE ALL ON FUNCTION public.subscribe_restock_alert(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- Prevent checkout from bypassing the client-key binding and notification link.
REVOKE ALL ON FUNCTION public.place_order_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order2_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;

-- These pricing and promo helpers are implementation details of the secure RPCs.
-- quote_cart_secure and check_promo_secure invoke them as their SECURITY DEFINER owner.
REVOKE ALL ON FUNCTION public.quote_cart(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_promo(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promo_calc_target(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Order tracking, cancellation and reviews remain available through their
-- separate phone + 24-character order access-code checks.


-- Fail closed if an old API entry point is still executable, or if a required
-- secure storefront RPC was accidentally revoked.
DO $postflight$
DECLARE
  v_signature text;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.get_favorites(text)',
    'public.toggle_favorite(text,uuid)',
    'public.get_notifications(text)',
    'public.mark_notifications_read(text,uuid)',
    'public.subscribe_restock_alert(text,uuid,text)',
    'public.place_order_secure(jsonb,jsonb,text)',
    'public.place_order2_secure(jsonb,jsonb,text)',
    'public.quote_cart(jsonb)',
    'public.check_promo(text,numeric,text,jsonb)',
    'public.promo_calc_target(text,numeric,text,jsonb)'
  ] LOOP
    IF has_function_privilege('anon', v_signature, 'EXECUTE')
       OR has_function_privilege('authenticated', v_signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'Legacy RPC remains executable: %', v_signature;
    END IF;
  END LOOP;

  FOREACH v_signature IN ARRAY ARRAY[
    'public.get_favorites(uuid)',
    'public.toggle_favorite(uuid,uuid)',
    'public.get_notifications(uuid)',
    'public.mark_notifications_read(uuid,uuid)',
    'public.claim_order_notifications(text,text,uuid)',
    'public.subscribe_restock_alert(text,uuid,text,uuid)',
    'public.place_order_secure(jsonb,jsonb,text,uuid)',
    'public.place_order2_secure(jsonb,jsonb,text,uuid)',
    'public.quote_cart_secure(jsonb)',
    'public.check_promo_secure(text,numeric,text,jsonb)'
  ] LOOP
    IF NOT has_function_privilege('anon', v_signature, 'EXECUTE')
       OR NOT has_function_privilege('authenticated', v_signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'Required secure RPC is not executable: %', v_signature;
    END IF;
  END LOOP;
END;
$postflight$;
