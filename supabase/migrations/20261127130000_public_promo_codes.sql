-- Keep promo_codes admin-managed while exposing only display fields to visitors.
-- Restrict the existing admin policy to authenticated users so anon never needs
-- permission to execute the SECURITY DEFINER is_admin() helper.

revoke select on table public.promo_codes from public, anon;
grant select on table public.promo_codes to authenticated;

alter policy pc_w
on public.promo_codes
to authenticated;

grant select (
  code,
  kind,
  percent,
  amount,
  expires_at,
  target_type,
  target_id,
  target_variant,
  starts_at,
  created_at
) on table public.promo_codes to anon;

drop policy if exists promo_codes_public_read on public.promo_codes;

create policy promo_codes_public_read
on public.promo_codes
for select
to anon
using (
  active is true
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now())
  and (max_uses is null or uses < max_uses)
);
