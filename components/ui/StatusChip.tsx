import { cn } from "@/lib/utils";
import type { TicketPriority, TicketStatus } from "@/lib/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "border-accent text-accent",
  pending: "border-rule-2 text-ink-2",
  resolved: "border-[var(--color-success)] text-[var(--color-success)]",
  closed: "border-rule text-muted",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export function StatusChip({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: TicketPriority }) {
  const isUrgent = priority === "urgent";
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1",
        isUrgent
          ? "border-[var(--color-warn)] bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
          : "border-rule text-muted",
      )}
    >
      {isUrgent && <span aria-hidden className="size-1.5 rounded-full bg-[var(--color-warn)]" />}
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
