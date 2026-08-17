"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tickets", label: "Tickets" },
  { href: "/tickets/new", label: "New" },
];

/** Small-viewport nav strip -- the desktop sidebar is hidden below `lg`. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-rule bg-paper-2 px-3 py-2 lg:hidden">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium",
              active ? "bg-accent-soft text-ink" : "text-ink-2",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
