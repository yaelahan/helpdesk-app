-- Brute-force protection for sign-in.
--
-- Supabase's built-in [auth.rate_limit] sign_in_sign_ups setting did not
-- fire on the hosted project (28 consecutive failed logins from one IP all
-- returned 400, never 429), and it is not observable or testable from the
-- app either way. This implements the control locally so it can be asserted.
--
-- Two windows, deliberately not a plain per-email counter:
--   (email, ip)  5 failures /  5 min  -- stops targeted guessing from a host
--   (ip)        20 failures / 15 min  -- stops spraying many accounts
--
-- The tight window is 5 minutes rather than 15 on purpose. Five bad passwords
-- from one host is far more often a real person typo-ing than an attacker, and
-- a 15 minute penalty for that reads as a broken app. Five minutes still caps
-- a single host at ~60 guesses/hour per account, which is useless for guessing
-- a password, while recovering fast enough that nobody files a bug.
--
-- A pure per-email limit would hand anyone an account-lockout DoS: fail five
-- times against a known address and the real owner is locked out. Keying the
-- tight limit on (email, ip) keeps that attack local to the attacker's own
-- host. The trade-off is that a distributed attack on one account is only
-- caught by the looser per-IP bound; the answer to that is a CAPTCHA or an
-- edge WAF, not a bigger table.

create table public.login_attempts (
  id bigint generated always as identity primary key,
  email_key text not null,
  ip text not null default 'unknown',
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index login_attempts_email_ip_idx
  on public.login_attempts (email_key, ip, attempted_at desc);
create index login_attempts_ip_idx
  on public.login_attempts (ip, attempted_at desc);

-- RLS on with zero policies, and no grants to anon/authenticated: the table
-- is unreachable through the Data API. The two SECURITY DEFINER functions
-- below are the only way in, and they are callable only by service_role --
-- see the grants at the bottom. If clients could write this table they could
-- poison the counters and lock other people out.
alter table public.login_attempts enable row level security;

create or replace function public.check_login_rate(p_email text, p_ip text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_pair constant int := 5;
  max_per_ip   constant int := 20;
  pair_win     constant interval := interval '5 minutes';
  ip_win       constant interval := interval '15 minutes';
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ip    text := coalesce(nullif(btrim(coalesce(p_ip, '')), ''), 'unknown');
  n int;
  oldest timestamptz;
begin
  -- targeted: this account, from this host
  select count(*), min(a.attempted_at) into n, oldest
    from login_attempts a
   where a.success = false
     and a.attempted_at > now() - pair_win
     and a.email_key = v_email
     and a.ip = v_ip;

  if n >= max_per_pair then
    return jsonb_build_object(
      'allowed', false,
      'retry_after', greatest(1, ceil(extract(epoch from (oldest + pair_win - now()))))::int
    );
  end if;

  -- spraying: many accounts, from this host
  if v_ip <> 'unknown' then
    select count(*), min(a.attempted_at) into n, oldest
      from login_attempts a
     where a.success = false
       and a.attempted_at > now() - ip_win
       and a.ip = v_ip;

    if n >= max_per_ip then
      return jsonb_build_object(
        'allowed', false,
        'retry_after', greatest(1, ceil(extract(epoch from (oldest + ip_win - now()))))::int
      );
    end if;
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

create or replace function public.record_login_attempt(
  p_email text,
  p_ip text,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ip    text := coalesce(nullif(btrim(coalesce(p_ip, '')), ''), 'unknown');
begin
  insert into login_attempts (email_key, ip, success)
  values (v_email, v_ip, coalesce(p_success, false));

  -- A successful sign-in clears that pair's recent failures, so someone who
  -- simply mistyped their password a few times is not left in a cooldown.
  if coalesce(p_success, false) then
    delete from login_attempts
     where email_key = v_email and ip = v_ip and success = false;
  end if;

  -- Opportunistic housekeeping; the table is only ever read over a 15 minute
  -- window, so anything older than a day is dead weight.
  delete from login_attempts where attempted_at < now() - interval '1 day';
end;
$$;

revoke all on function public.check_login_rate(text, text) from public, anon, authenticated;
revoke all on function public.record_login_attempt(text, text, boolean) from public, anon, authenticated;
grant execute on function public.check_login_rate(text, text) to service_role;
grant execute on function public.record_login_attempt(text, text, boolean) to service_role;
grant all on public.login_attempts to service_role;
grant usage, select on all sequences in schema public to service_role;
