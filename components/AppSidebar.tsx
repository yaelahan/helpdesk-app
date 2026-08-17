import Link from "next/link";
import type { ReactNode } from "react";
import { isStaff } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session";
import {
  DashboardIcon,
  QueueIcon,
  NewTicketIcon,
  SignOutIcon,
} from "@/components/ui/icons";

const ROLE_LABEL: Record<NonNullable<SessionUser["role"]>, string> = {
  admin: "Admin",
  agent: "Agent",
  customer: "Customer",
};

/**
 * Application sidebar -- component-scope, not from Hallmark's N1-N13 nav
 * catalog (those are all marketing navs). Built directly on Cobalt's
 * hairline vocabulary instead of being mislabelled as N3.
 */
export function AppSidebar({ user }: { user: SessionUser }) {
  const staff = isStaff(user.role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-rule bg-paper-2 lg:flex">
      {/* h-[--nav-height] matches the main column's top bar exactly, so the
          two bottom hairlines meet at the sidebar edge. Padding-based
          heights left them ~3px apart, which read as a rendering glitch. */}
      <div className="flex h-[var(--nav-height)] shrink-0 items-center border-b border-rule px-5">
        <Link href="/dashboard" className="font-display text-lg font-semibold text-ink">
          HelpdeskApp
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <SidebarLink href="/dashboard" icon={<DashboardIcon />}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/tickets" icon={<QueueIcon />}>
          {staff ? "Queue" : "My tickets"}
        </SidebarLink>
        <SidebarLink href="/tickets/new" icon={<NewTicketIcon />}>
          New ticket
        </SidebarLink>
      </nav>

      <div className="border-t border-rule p-4">
        <p className="truncate text-sm font-medium text-ink">
          {user.fullName ?? user.email}
        </p>
        <p className="mono-label mt-1 text-accent">
          {user.role ? ROLE_LABEL[user.role] : "No role"}
        </p>
        <form action="/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="mono-label flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-rule-2 px-3 py-2 text-left text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            <SignOutIcon className="size-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
    >
      <span className="text-muted transition-colors group-hover:text-ink">{icon}</span>
      {children}
    </Link>
  );
}
