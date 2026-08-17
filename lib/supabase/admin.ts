import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER-ONLY -- it bypasses RLS entirely.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY, which has no NEXT_PUBLIC_ prefix, so it is
 * never inlined into the client bundle; importing this from a client component
 * would yield an undefined key rather than leaking it.
 *
 * Used for exactly one job: the sign-in rate limiter. That state cannot be
 * client-writable -- if anon could call record_login_attempt it could poison
 * the counters and lock other users out -- so the two RPCs in
 * 0006_login_throttle.sql are granted to service_role only.
 *
 * Returns null when the key is absent (e.g. a preview deploy that wasn't given
 * the secret). Callers must treat null as "cannot rate limit" and decide
 * explicitly what to do; see app/api/auth/login/route.ts.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
