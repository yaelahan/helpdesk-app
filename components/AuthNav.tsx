"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** N9 edge-aligned minimal: wordmark hard-left, single CTA hard-right, silence between. */
export function AuthNav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="font-display text-lg font-semibold text-ink">
        HelpdeskApp
      </Link>
      <Link
        href={isLogin ? "/register" : "/login"}
        className="mono-label rounded-[var(--radius-sm)] border border-rule-2 px-3 py-2 text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        {isLogin ? "Create account" : "Sign in"}
      </Link>
    </header>
  );
}
