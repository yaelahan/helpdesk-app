-- create_ticket(): the throttle boundary.
--
-- INSERT on tickets is revoked from `authenticated` (see below) so this
-- function is the ONLY way to create a ticket. That matters because the
-- browser holds a Supabase anon/authenticated key and could otherwise call
-- PostgREST directly, bypassing any limit enforced only in a Next.js route
-- handler. Revoking INSERT is what makes the throttle real rather than
-- decorative.
--
-- pg_advisory_xact_lock serializes concurrent calls per user so two
-- simultaneous requests can't both observe count < limit and both insert --
-- closing the check-then-insert race a naive COUNT(*) guard would have.

create or replace function public.create_ticket(
  p_subject text,
  p_body text,
  p_priority public.ticket_priority default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_per_hour constant int := 10;
  window_start timestamptz := now() - interval '1 hour';
  recent int;
  oldest timestamptz;
  new_row public.tickets;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ticket_rl:' || auth.uid()::text, 0));

  select count(*), min(created_at)
    into recent, oldest
    from public.tickets
    where user_id = auth.uid() and created_at > window_start;

  if recent >= limit_per_hour then
    return jsonb_build_object(
      'ok', false,
      'reason', 'rate_limited',
      'retry_after', greatest(
        1,
        ceil(extract(epoch from (oldest + interval '1 hour' - now())))
      )::int
    );
  end if;

  insert into public.tickets (user_id, subject, body, priority)
  values (auth.uid(), p_subject, p_body, p_priority)
  returning * into new_row;

  return jsonb_build_object('ok', true, 'ticket', to_jsonb(new_row));
end;
$$;

revoke all on function public.create_ticket from public;
revoke execute on function public.create_ticket from anon;
grant execute on function public.create_ticket to authenticated;

revoke insert on public.tickets from authenticated;

-- add_reply(): customers may only reply on their own ticket and can never
-- set is_internal -- that flag is forced false for anyone who isn't staff,
-- enforced here rather than trusted from the client.

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
  staff boolean := public.is_staff();
  new_row public.ticket_replies;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select user_id into ticket_owner from public.tickets where id = p_ticket_id;

  if ticket_owner is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not staff and ticket_owner <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  insert into public.ticket_replies (ticket_id, user_id, body, is_internal)
  values (p_ticket_id, auth.uid(), p_body, staff and p_is_internal)
  returning * into new_row;

  return jsonb_build_object('ok', true, 'reply', to_jsonb(new_row));
end;
$$;

revoke all on function public.add_reply from public;
revoke execute on function public.add_reply from anon;
grant execute on function public.add_reply to authenticated;

revoke insert on public.ticket_replies from authenticated;
