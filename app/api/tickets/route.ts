import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { createTicketSchema } from "@/lib/validation";
import type { Ticket } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to create a ticket.");
  }

  const json = await request.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Check the ticket fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { subject, body, priority } = parsed.data;

  // All writes go through create_ticket(): it's a SECURITY DEFINER function
  // with the rate-limit check inside it, and INSERT is revoked on `tickets`
  // for `authenticated` -- so this RPC call is the only path that can ever
  // create a row. See supabase/migrations/0004_rpc.sql.
  const { data, error } = await supabase.rpc("create_ticket", {
    p_subject: subject,
    p_body: body,
    p_priority: priority,
  });

  if (error) {
    return jsonError(500, "INTERNAL_ERROR", "Could not create the ticket.");
  }

  const result = data as
    | { ok: true; ticket: Ticket }
    | { ok: false; reason: "unauthenticated" | "rate_limited"; retry_after?: number };

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      const retryAfter = result.retry_after ?? 3600;
      return jsonError(
        429,
        "RATE_LIMITED",
        "You've reached the ticket limit for this hour. Try again shortly.",
        undefined,
        {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      );
    }
    return jsonError(401, "UNAUTHENTICATED", "Sign in to create a ticket.");
  }

  return jsonOk(result.ticket, 201);
}
