-- Store password lockout. Run once after shop.sql.
-- Every password guess is recorded first, then checked. Too many wrong guesses lock the check:
--   5 from one device (hashed IP) in 15 minutes → that device waits 15 minutes;
--   30 from anywhere in an hour → everyone waits an hour (bots can rotate IPs, so this is the real brake).
-- A correct password clears that device's record. Rows older than a day are deleted automatically.

create table if not exists public.shop_auth_fails (
  id bigserial primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists shop_auth_fails_at on public.shop_auth_fails (at);
create index if not exists shop_auth_fails_ip_at on public.shop_auth_fails (ip_hash, at);
-- Private (no RLS policy): only the shop function touches it.
alter table public.shop_auth_fails enable row level security;

-- Returns null when this guess may be checked (and records it), or the time the lock ends.
-- One transaction-wide lock, so a bot firing many guesses at once can't slip past the limit.
create or replace function public.shop_auth_attempt(p_ip text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  mine timestamptz;
  everyone timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('shop_auth_attempt'));
  delete from shop_auth_fails where at < now() - interval '1 day';
  select at + interval '15 minutes' into mine from shop_auth_fails
    where ip_hash = p_ip and at > now() - interval '15 minutes'
    order by at desc offset 4 limit 1;
  select at + interval '1 hour' into everyone from shop_auth_fails
    where at > now() - interval '1 hour'
    order by at desc offset 29 limit 1;
  if mine is not null or everyone is not null then
    return greatest(mine, everyone);
  end if;
  insert into shop_auth_fails (ip_hash) values (p_ip);
  return null;
end
$$;

-- Only the shop function (secret key) may call it.
revoke execute on function public.shop_auth_attempt(text) from public, anon, authenticated;
