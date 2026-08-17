-- Core schema: roles, profiles, tickets, replies.

create type app_role        as enum ('admin', 'agent', 'customer');
create type ticket_status   as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_to uuid references auth.users (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 5000),
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_replies (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

-- Query-shaped indexes.
create index user_roles_user_id_idx on public.user_roles (user_id);
create index tickets_user_created_idx on public.tickets (user_id, created_at desc);
create index tickets_status_created_idx on public.tickets (status, created_at desc);
create index tickets_assigned_idx on public.tickets (assigned_to) where assigned_to is not null;
create index ticket_replies_thread_idx on public.ticket_replies (ticket_id, created_at);

-- Keep tickets.updated_at honest.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row
  execute function public.set_updated_at();

-- New auth.users row -> profile + default role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Table privileges: the new Supabase CLI default is "not auto-exposed", so
-- these grants are load-bearing, not decorative. RLS still gates rows.
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, update on public.tickets to authenticated; -- insert stays revoked, see 0004
grant select on public.ticket_replies to authenticated;  -- insert stays revoked, see 0004

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
