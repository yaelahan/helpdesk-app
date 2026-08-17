"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardIcon, QueueIcon, NewTicketIcon } from "@/components/ui/icons";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/tickets", label: "Tickets", Icon: QueueIcon },
  { href: "/tickets/new", label: "New", Icon: NewTicketIcon },
];

/** Small-viewport nav strip -- the desktop sidebar is hidden below `lg`. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-rule bg-paper-2 px-3 py-2 lg:hidden">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium",
              active ? "bg-accent-soft text-ink" : "text-ink-2",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
