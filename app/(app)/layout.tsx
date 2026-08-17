import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CommandPalette } from "@/components/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <AppSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <header className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-6">
            <p className="mono-label text-muted lg:hidden">HelpdeskApp</p>
            <div className="ml-auto">
              <CommandPalette />
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-[var(--page-max)]">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
