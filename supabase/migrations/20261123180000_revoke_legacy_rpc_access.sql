-- Phase 2: apply after the new frontend is deployed and smoke-tested.
-- This closes legacy phone-only RPCs and restricts internal SECURITY DEFINER helpers.

-- Remove phone-only RPC entry points while keeping them in place for rollback.
REVOKE ALL ON FUNCTION public.get_favorites(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_favorite(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_notifications(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.subscribe_restock_alert(text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order2_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promo_calc_target(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_promo(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.quote_cart(jsonb) FROM PUBLIC, anon, authenticated;

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

-- Preserve required guest/user flows with narrow role grants.
REVOKE ALL ON FUNCTION public.cancel_my_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.track_my_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_my_order(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.review_my_order(text, text, uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_my_order(text, text, uuid, integer, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_account_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_account_orders() TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.set_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text) TO authenticated;

-- Internal SECURITY DEFINER helpers are callable only by their owners/triggers.
REVOKE ALL ON FUNCTION public.apply_delivery_rules_to_order() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stock(jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_order(integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_order_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.offers_discount(uuid[], numeric[], boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.offers_release() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order2(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promo_calc(text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_review(integer, text, uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_order(integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_orders(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.map_notification_clients() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_guest_cart(jsonb, boolean) FROM PUBLIC, anon, authenticated;

