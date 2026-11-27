-- Expose only the fields required to display currently usable promo codes.
-- The base table remains admin-only; anonymous reads are column-limited and row-filtered.

revoke select on table public.promo_codes from anon;

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

create view public.public_promo_codes
with (security_invoker = true)
as
select
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
from public.promo_codes
where
  active is true
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now())
  and (max_uses is null or uses < max_uses);

revoke all on table public.public_promo_codes from public, authenticated;
grant select on table public.public_promo_codes to anon;
