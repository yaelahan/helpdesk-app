"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface TicketHit {
  id: number;
  subject: string;
  status: string;
}

const STATIC_COMMANDS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tickets", href: "/tickets" },
  { label: "New ticket", href: "/tickets/new" },
];

/** Cobalt's signature interactive move: a real, working ⌘K palette. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<TicketHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette]);

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase
        .from("tickets")
        .select("id, subject, status")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setTickets((data as TicketHit[]) ?? []));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filteredTickets = tickets.filter((t) =>
    t.subject.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredCommands = STATIC_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );
  const items = [
    ...filteredCommands.map((c) => ({ kind: "command" as const, ...c })),
    ...filteredTickets.map((t) => ({
      kind: "ticket" as const,
      label: t.subject,
      href: `/tickets/${t.id}`,
      status: t.status,
      id: t.id,
    })),
  ];

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      go(items[activeIndex].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="mono-label flex items-center gap-2 rounded-[var(--radius-sm)] border border-rule-2 px-3 py-2 text-muted transition-colors hover:border-accent hover:text-accent"
      >
        Jump to…
        <kbd className="rounded-[4px] border border-rule px-1.5 py-0.5 text-[0.65rem]">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="fixed inset-0 z-[var(--z-overlay)] flex items-start justify-center bg-[oklch(24%_0.02_258_/_0.45)] px-4 pt-24"
          onClick={() => setOpen(false)}
        >
          <div
            className="reveal is-in w-full max-w-lg overflow-hidden rounded-[var(--radius-md)] border border-rule-2 bg-paper shadow-[0_1px_2px_oklch(24%_0.02_258_/_0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search tickets or jump to a page…"
              className="w-full border-b border-rule bg-transparent px-4 py-3.5 font-mono text-sm text-ink outline-none placeholder:text-muted"
            />
            <ul className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
              )}
              {items.map((item, i) => (
                <li key={`${item.kind}-${item.href}`}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm",
                      i === activeIndex ? "bg-accent-soft text-ink" : "text-ink-2",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.kind === "ticket" && (
                      <span className="mono-label text-muted">{item.status}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
