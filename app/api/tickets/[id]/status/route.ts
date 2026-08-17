import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { jsonError, jsonOk } from "@/lib/api";
import { updateStatusSchema } from "@/lib/validation";

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
  if (!isAdmin(sessionUser.role)) {
    return jsonError(403, "FORBIDDEN", "Only admins can change ticket status.");
  }

  const json = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(json);
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
    .update({ status: parsed.data.status })
    .eq("id", ticketId)
    .select()
    .maybeSingle();

  if (error) {
    return jsonError(500, "INTERNAL_ERROR", "Could not update the status.");
  }
  if (!data) {
    return jsonError(404, "NOT_FOUND", "Ticket not found.");
  }

  return jsonOk(data);
}
