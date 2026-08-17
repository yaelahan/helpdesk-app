import type { ReactNode } from "react";
import { AuthNav } from "@/components/AuthNav";
import { AuthFooter } from "@/components/AuthFooter";

/* Hallmark · macrostructure: Split Studio · nav: N9 · footer: Ft2 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AuthNav />
      <main className="grid flex-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="hidden border-l border-rule bg-[var(--color-graphite)] px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <p className="mono-label text-[var(--color-muted-on-dark)]">Support desk</p>

          <div className="max-w-sm">
            <p className="text-display-s font-display font-semibold text-white">
              One queue. Every request accounted for.
            </p>
            <p className="mt-4 text-sm text-[var(--color-muted-on-dark)]">
              Customers follow their own requests from open to resolved. Your
              team works a single shared queue — with private notes that stay
              private.
            </p>
          </div>

          <ul className="max-w-sm border-t border-[var(--color-rule-on-dark)]">
            {[
              "Threaded replies on every ticket",
              "Priority and status at a glance",
              "Internal notes visible only to your team",
            ].map((point) => (
              <li
                key={point}
                className="border-b border-[var(--color-rule-on-dark)] py-3 text-sm text-[var(--color-muted-on-dark)]"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
