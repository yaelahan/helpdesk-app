import type { AppRole } from "@/lib/types";

/**
 * Mirrors the SQL predicates in supabase/migrations/0003_rls.sql
 * (has_role / is_staff). These are for UI gating ONLY -- hiding a button,
 * choosing which dashboard to render. They are NOT the enforcement
 * boundary: every table is RLS-protected and every write goes through a
 * SECURITY DEFINER function that re-checks the role server-side. Deleting
 * this file would change what the UI shows, never what a user can do.
 */

export function isStaff(role: AppRole | null): boolean {
  return role === "admin" || role === "agent";
}

export function isAdmin(role: AppRole | null): boolean {
  return role === "admin";
}

export function canReplyInternal(role: AppRole | null): boolean {
  return isStaff(role);
}

/** Reads the role stamped into the JWT by custom_access_token_hook. */
export function roleFromJwtClaims(
  appMetadata: Record<string, unknown> | undefined,
): AppRole | null {
  const role = appMetadata?.user_role;
  return role === "admin" || role === "agent" || role === "customer"
    ? role
    : null;
}
