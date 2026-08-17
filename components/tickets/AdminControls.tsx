"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { TicketStatus } from "@/lib/types";
import type { Assignee } from "@/lib/data/tickets";

const STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];

export function StatusControl({ ticketId, status }: { ticketId: number; status: TicketStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState(false);

  async function onChange(value: TicketStatus) {
    setPending(true);
    const res = await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setPending(false);
    if (res.ok) {
      push("Status updated.", "success");
      router.refresh();
    } else {
      push("Couldn't update status.", "error");
    }
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="mono-label text-muted">Status</span>
      <Select
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as TicketStatus)}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function AssignControl({
  ticketId,
  assignedTo,
  assignees,
}: {
  ticketId: number;
  assignedTo: string | null;
  assignees: Assignee[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState(false);

  async function onChange(value: string) {
    setPending(true);
    const res = await fetch(`/api/tickets/${ticketId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: value || null }),
    });
    setPending(false);
    if (res.ok) {
      push("Assignment updated.", "success");
      router.refresh();
    } else {
      push("Couldn't update assignment.", "error");
    }
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="mono-label text-muted">Assigned to</span>
      <Select
        value={assignedTo ?? ""}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Unassigned</option>
        {assignees.map((s) => (
          <option key={s.user_id} value={s.user_id}>
            {s.full_name ?? s.user_id}
          </option>
        ))}
      </Select>
    </label>
  );
}
