import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { createReplySchema } from "@/lib/validation";
import type { TicketReply } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid ticket id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to reply.");
  }

  const json = await request.json().catch(() => null);
  const parsed = createReplySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Check the reply body.",
      parsed.error.flatten().fieldErrors,
    );
  }

  // add_reply() re-derives admin status server-side and forces is_internal
  // to false for non-admins regardless of what the client sends -- see
  // supabase/migrations/0004_rpc.sql.
  const { data, error } = await supabase.rpc("add_reply", {
    p_ticket_id: ticketId,
    p_body: parsed.data.body,
    p_is_internal: parsed.data.isInternal,
  });

  if (error) {
    return jsonError(500, "INTERNAL_ERROR", "Could not post the reply.");
  }

  const result = data as
    | { ok: true; reply: TicketReply }
    | { ok: false; reason: "unauthenticated" | "not_found" | "forbidden" };

  if (!result.ok) {
    if (result.reason === "not_found") {
      return jsonError(404, "NOT_FOUND", "Ticket not found.");
    }
    if (result.reason === "forbidden") {
      return jsonError(403, "FORBIDDEN", "You can't reply to this ticket.");
    }
    return jsonError(401, "UNAUTHENTICATED", "Sign in to reply.");
  }

  return jsonOk(result.reply, 201);
}
