import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import { jsonError, jsonOk } from "@/lib/api";
import { assignTicketSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid ticket id.");
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in.");
  }
  // UI-cosmetic pre-check for a clean 403; RLS (is_staff()) is the real
  // enforcement -- see supabase/migrations/0003_rls.sql.
  if (!isStaff(sessionUser.role)) {
    return jsonError(403, "FORBIDDEN", "Only staff can assign tickets.");
  }

  const json = await request.json().catch(() => null);
  const parsed = assignTicketSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Check the request body.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .update({ assigned_to: parsed.data.assignedTo })
    .eq("id", ticketId)
    .select()
    .maybeSingle();

  if (error) {
    return jsonError(500, "INTERNAL_ERROR", "Could not assign the ticket.");
  }
  if (!data) {
    return jsonError(404, "NOT_FOUND", "Ticket not found.");
  }

  return jsonOk(data);
}
