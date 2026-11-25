-- Disable legacy phone-only guest access RPCs after the secure client-key
-- overloads are installed and the matching frontend is deployed.
-- SECURITY DEFINER wrappers owned by postgres can still call these functions
-- internally; anon/authenticated clients cannot invoke the legacy signatures.

REVOKE ALL ON FUNCTION public.get_favorites(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_favorite(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_notifications(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.subscribe_restock_alert(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- Keep the legacy order/promo/cart implementations available only as
-- internal helpers for the new validated SECURITY DEFINER wrappers.
REVOKE ALL ON FUNCTION public.place_order_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order2_secure(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.quote_cart(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promo_calc_target(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_promo(text, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;
