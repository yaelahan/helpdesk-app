-- Authorization helpers + RLS policies.
--
-- Two helpers, deliberately different freshness:
--   has_role()       reads the JWT claim -- fast, but stale until the token
--                     refreshes (up to one token lifetime after a role change).
--   has_role_fresh() reads user_roles directly -- always current, slower.
--                     Used only where staleness would be a privilege bug
--                     (granting/revoking roles themselves).

create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'user_role')::public.app_role = any(roles),
    false
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.has_role(array['admin', 'agent']::public.app_role[]);
$$;

create or replace function public.has_role_fresh(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(roles)
  );
$$;

-- profiles: read own or staff; update own only.
create policy "profiles select own or staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- user_roles: read own or staff. Mutation requires a FRESH admin check --
-- has_role() would let a just-demoted admin keep granting roles for up to
-- one token lifetime.
create policy "user_roles select own or staff"
  on public.user_roles for select
  using (user_id = auth.uid() or public.is_staff());

create policy "user_roles admin manages"
  on public.user_roles for all
  using (public.has_role_fresh(array['admin']::public.app_role[]))
  with check (public.has_role_fresh(array['admin']::public.app_role[]));

-- tickets: customers see/only their own; staff see/update all.
-- INSERT is intentionally NOT granted here -- all creates go through
-- create_ticket() in 0004, which enforces the rate limit. A permissive
-- INSERT policy here would make that limit bypassable via a direct
-- PostgREST call.
create policy "tickets select own or staff"
  on public.tickets for select
  using (user_id = auth.uid() or public.is_staff());

create policy "tickets update staff only"
  on public.tickets for update
  using (public.is_staff())
  with check (public.is_staff());

-- ticket_replies: staff see everything; customers see their own thread's
-- non-internal replies only. INSERT goes through add_reply() in 0004.
create policy "ticket_replies select thread"
  on public.ticket_replies for select
  using (
    public.is_staff()
    or (
      is_internal = false
      and exists (
        select 1 from public.tickets t
        where t.id = ticket_replies.ticket_id and t.user_id = auth.uid()
      )
    )
  );
