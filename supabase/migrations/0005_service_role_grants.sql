-- The newer Supabase CLI default is "new tables are NOT auto-exposed to any
-- Data API role, including service_role" -- RLS bypass for service_role is
-- a separate mechanism from table GRANTs, and Postgres checks GRANTs first.
-- Without these, the seed script (which uses the service-role key on
-- purpose, to write across users while bypassing RLS) gets a plain
-- "permission denied for table" even though service_role ignores RLS.

grant all on public.profiles, public.user_roles, public.tickets, public.ticket_replies
  to service_role;

grant usage, select on all sequences in schema public to service_role;
