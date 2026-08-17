import type { AppRole } from "@/lib/types";

/**
 * Mirrors the SQL predicates in supabase/migrations/0007_two_roles.sql
 * (is_admin). These are for UI gating ONLY -- hiding a button, choosing which
 * dashboard to render. They are NOT the enforcement boundary: every table is
 * RLS-protected and every write goes through a SECURITY DEFINER function that
 * re-checks the role server-side. Deleting this file would change what the UI
 * shows, never what a user can do.
 */

export function isAdmin(role: AppRole | null): boolean {
  return role === "admin";
}

/** Only admins may leave notes customers cannot see. */
export function canReplyInternal(role: AppRole | null): boolean {
  return isAdmin(role);
}

/** Only customers raise tickets -- create_ticket() files against auth.uid(). */
export function canCreateTicket(role: AppRole | null): boolean {
  return role === "customer";
}

/** Reads the role stamped into the JWT by custom_access_token_hook. */
export function roleFromJwtClaims(
  appMetadata: Record<string, unknown> | undefined,
): AppRole | null {
  const role = appMetadata?.user_role;
  return role === "admin" || role === "customer" ? role : null;
}
