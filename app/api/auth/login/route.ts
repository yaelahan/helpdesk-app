import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, jsonError, jsonOk } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

/**
 * Sign-in proxy.
 *
 * The browser used to call supabase.auth.signInWithPassword() directly, which
 * meant no server of ours ever saw a login attempt and there was nothing to
 * rate limit. Routing it through here puts the attempt behind a counter we
 * own (see supabase/migrations/0006_login_throttle.sql) at the cost of one
 * extra hop.
 *
 * Session cookies are still set by @supabase/ssr -- signInWithPassword on the
 * server client writes them through the cookies() store, which is writable in
 * a Route Handler.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Check your email and password.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, password } = parsed.data;
  const ip = clientIp(request);
  const admin = createAdminClient();

  // Fail open if the service key is absent: a missing secret should degrade
  // the rate limit, not lock everyone out of the app.
  if (admin) {
    const { data } = await admin.rpc("check_login_rate", {
      p_email: email,
      p_ip: ip,
    });
    const verdict = data as { allowed: boolean; retry_after?: number } | null;

    if (verdict && verdict.allowed === false) {
      const retryAfter = verdict.retry_after ?? 900;
      return jsonError(
        429,
        "RATE_LIMITED",
        "Too many sign-in attempts. Try again shortly.",
        undefined,
        { "Retry-After": String(retryAfter) },
      );
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (admin) {
    await admin.rpc("record_login_attempt", {
      p_email: email,
      p_ip: ip,
      p_success: !error,
    });
  }

  if (error) {
    // One message for every failure mode. Distinguishing "wrong password"
    // from "no such account" confirms which addresses are registered, and
    // surfacing "email not confirmed" does the same. The client shows a
    // standing "just registered? check your inbox" hint instead, which helps
    // real users without answering an attacker's question.
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  return jsonOk({ ok: true });
}
