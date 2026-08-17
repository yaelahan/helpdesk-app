import { createClient } from "@/lib/supabase/server";
import { roleFromJwtClaims } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AppRole | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Server Component / Route Handler helper: current user + role, or null.
 *
 * `supabase.auth.getUser()` re-validates the token against the Auth server
 * -- that round trip is what actually proves the session is genuine, so it
 * stays. But the `user` object it returns reflects
 * `auth.users.raw_app_meta_data`, NOT the claims `custom_access_token_hook`
 * (0002_auth_hook.sql) injects -- those only exist inside the signed JWT
 * itself, added at token-issue time. So the role is read by decoding the
 * access token's own payload instead.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const claims = session ? decodeJwtPayload(session.access_token) : null;
  const appMetadata =
    (claims?.app_metadata as Record<string, unknown> | undefined) ?? user.app_metadata;

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    role: roleFromJwtClaims(appMetadata),
  };
}
