import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in · HelpdeskApp" };

/**
 * Reads the query string here and passes it down, rather than letting the form
 * call useSearchParams(). That hook forces Next to skip prerendering the
 * subtree that uses it, which shipped an empty <Suspense> boundary and left
 * the form to be built client-side -- the page arrived with no form in the
 * HTML at all. Resolving the params server-side puts the form back in the
 * server response at the cost of making this route dynamic, which an auth
 * screen does not care about.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return <LoginForm next={next ?? "/dashboard"} linkError={error ?? null} />;
}
