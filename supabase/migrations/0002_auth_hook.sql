-- Custom Access Token Hook: stamps the user's role into the JWT so RLS
-- policies can read it without a table lookup on every request.
--
-- Deliberately NOT stored in auth.users.raw_user_meta_data: that field is
-- writable by the user themselves via supabase.auth.updateUser(), so storing
-- a role there is a one-line privilege escalation. The role lives in
-- public.user_roles instead, which only this hook (and admins, via RLS) can
-- read/write.

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
  order by role -- deterministic if a user ever holds >1 role
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

-- The hook runs as supabase_auth_admin, which cannot see `public` by default.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

grant select on public.user_roles to supabase_auth_admin;

create policy "auth admin reads roles for token hook"
  on public.user_roles
  for select
  to supabase_auth_admin
  using (true);
