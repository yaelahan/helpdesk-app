import type { ReactNode } from "react";
import { AuthNav } from "@/components/AuthNav";
import { AuthFooter } from "@/components/AuthFooter";

/* Hallmark · centred single-column auth · nav: N9 edge-aligned · footer: Ft2
 * Previously a Split Studio diptych with a product panel opposite the form.
 * Dropped: on an auth screen the second column is a distraction from the one
 * action the page exists for, and it pushed the form off-centre on wide
 * viewports for no functional gain.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AuthNav />
      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <AuthFooter />
    </div>
  );
}
