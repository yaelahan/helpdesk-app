import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketReply, Profile } from "@/lib/types";

/**
 * These reads talk to Postgres directly through PostgREST -- no manual
 * `where user_id = ...` filtering here. Row Level Security (see
 * supabase/migrations/0007_two_roles.sql) already scopes every query to what the
 * caller is allowed to see; a customer's SELECT * from tickets and an admin's
 * SELECT * from tickets return different rows from the identical query.
 */

export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTicket(id: number): Promise<Ticket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReplies(ticketId: number): Promise<TicketReply[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProfilesByIds(ids: string[]): Promise<Map<string, Profile>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p]));
}

// Display hint only, mirrors the limit in create_ticket() (0004_rpc.sql).
// The RPC is the enforcement point regardless of what this shows.
const TICKET_RATE_LIMIT = 10;

export async function getTicketQuota(userId: string): Promise<{ used: number; limit: number }> {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("created_at", windowStart);

  if (error) throw error;
  return { used: count ?? 0, limit: TICKET_RATE_LIMIT };
}

export interface Assignee {
  user_id: string;
  full_name: string | null;
}

/** Admins are the only role that can own a ticket, so they're the assignees. */
export async function getAssignableAdmins(): Promise<Assignee[]> {
  const supabase = await createClient();
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("role", "admin");
  if (error) throw error;

  const ids = (roles ?? []).map((r) => r.user_id);
  const profiles = await getProfilesByIds(ids);

  return (roles ?? []).map((r) => ({
    user_id: r.user_id,
    full_name: profiles.get(r.user_id)?.full_name ?? null,
  }));
}
