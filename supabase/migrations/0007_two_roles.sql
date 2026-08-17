-- Collapse the role model from three to two: admin and customer.
--
-- The original schema shipped customer/agent/admin, but agent and admin ended
-- up separated by exactly one capability -- mutating user_roles -- and there is
-- no UI for that, so in the running app the two were indistinguishable. A role
-- that cannot be demonstrated is a liability, so agent is gone.
--
-- 'customer' is retained rather than renamed to 'user': it is the clearer word
-- in a helpdesk, and `user` collides with SQL's own keyword in enough contexts
-- to be a nuisance. The README records the mapping.
--
-- Postgres cannot remove a value from an enum in place, so the type is
-- replaced: rename the old one aside, create the new one, convert the column
-- through text, drop the old. Policies and helpers that mention the type have
-- to be dropped first because policy dependencies are tracked, then rebuilt.

-- 1. Nobody may be left holding the value being removed. Anyone who was an
--    agent becomes an admin; drop the row instead if they already are one,
--    since (user_id, role) is unique.
--    Compared as text rather than as an enum literal: once the value is gone
--    from the type, `role = 'agent'` is a hard error, which would make this
--    file impossible to re-run. `role::text` is valid either way.
delete from public.user_roles a
 where a.role::text = 'agent'
   and exists (
     select 1 from public.user_roles b
      where b.user_id = a.user_id and b.role::text = 'admin'
   );

update public.user_roles set role = 'admin' where role::text = 'agent';

-- 2. Drop what depends on the type or on is_staff(). Both the old names and
--    the ones created below are dropped, so re-running this file after a
--    partial failure converges instead of erroring on an existing policy.
drop policy if exists "profiles select own or staff"   on public.profiles;
drop policy if exists "profiles select own or admin"   on public.profiles;
drop policy if exists "user_roles select own or staff" on public.user_roles;
drop policy if exists "user_roles select own or admin" on public.user_roles;
drop policy if exists "user_roles admin manages"       on public.user_roles;
drop policy if exists "tickets select own or staff"    on public.tickets;
drop policy if exists "tickets select own or admin"    on public.tickets;
drop policy if exists "tickets update staff only"      on public.tickets;
drop policy if exists "tickets update admin only"      on public.tickets;
drop policy if exists "ticket_replies select thread"   on public.ticket_replies;

drop function if exists public.is_staff();
drop function if exists public.has_role(public.app_role[]);
drop function if exists public.has_role_fresh(public.app_role[]);

-- 3. Swap the enum.
alter type public.app_role rename to app_role_legacy;
create type public.app_role as enum ('admin', 'customer');

alter table public.user_roles
  alter column role type public.app_role
  using role::text::public.app_role;

drop type public.app_role_legacy;

-- 4. Rebuild the helpers. With two roles, generic array membership was
--    over-abstraction; these say what they mean.
--
--    is_admin() trusts the JWT claim: fast, but stale until the token
--    refreshes. is_admin_fresh() reads the table: always current, and used
--    only where staleness would be a privilege bug -- granting roles.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin',
    false
  );
$$;

create or replace function public.is_admin_fresh()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
     where user_id = auth.uid() and role = 'admin'
  );
$$;

-- 5. Rebuild the policies.
create policy "profiles select own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "user_roles select own or admin"
  on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "user_roles admin manages"
  on public.user_roles for all
  using (public.is_admin_fresh())
  with check (public.is_admin_fresh());

create policy "tickets select own or admin"
  on public.tickets for select
  using (user_id = auth.uid() or public.is_admin());

create policy "tickets update admin only"
  on public.tickets for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "ticket_replies select thread"
  on public.ticket_replies for select
  using (
    public.is_admin()
    or (
      is_internal = false
      and exists (
        select 1 from public.tickets t
        where t.id = ticket_replies.ticket_id and t.user_id = auth.uid()
      )
    )
  );

-- 6. add_reply() called is_staff(); repoint it. Behaviour is unchanged:
--    is_internal is still forced false for anyone who isn't privileged.
create or replace function public.add_reply(
  p_ticket_id bigint,
  p_body text,
  p_is_internal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_owner uuid;
  privileged boolean := public.is_admin();
  new_row public.ticket_replies;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select user_id into ticket_owner from public.tickets where id = p_ticket_id;

  if ticket_owner is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not privileged and ticket_owner <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  insert into public.ticket_replies (ticket_id, user_id, body, is_internal)
  values (p_ticket_id, auth.uid(), p_body, privileged and p_is_internal)
  returning * into new_row;

  return jsonb_build_object('ok', true, 'reply', to_jsonb(new_row));
end;
$$;

revoke all on function public.add_reply from public;
revoke execute on function public.add_reply from anon;
grant execute on function public.add_reply to authenticated;

-- 7. The token hook declares a variable of type app_role; re-create it so it
--    binds to the new type rather than a stale cached reference.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  found_role public.app_role;
begin
  select role into found_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid
  order by role
  limit 1;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{app_metadata,user_role}',
    coalesce(to_jsonb(found_role), 'null'::jsonb),
    true
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
