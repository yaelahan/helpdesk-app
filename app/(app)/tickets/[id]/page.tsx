import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import {
  getTicket,
  getReplies,
  getProfilesByIds,
  getStaffMembers,
} from "@/lib/data/tickets";
import { isStaff, canReplyInternal } from "@/lib/auth/roles";
import { StatusChip, PriorityChip } from "@/components/ui/StatusChip";
import { ReplyForm } from "@/components/tickets/ReplyForm";
import { StatusControl, AssignControl } from "@/components/tickets/StaffControls";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ticket · HelpdeskApp" };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) notFound();

  const user = await getSessionUser();
  if (!user) return null;

  // RLS returns null for both "doesn't exist" and "not visible to you" --
  // that ambiguity is intentional, see the API route handlers' 404s.
  const ticket = await getTicket(ticketId);
  if (!ticket) notFound();

  const staff = isStaff(user.role);
  const [replies, requesterMap, staffMembers] = await Promise.all([
    getReplies(ticketId),
    getProfilesByIds([ticket.user_id]),
    staff ? getStaffMembers() : Promise.resolve([]),
  ]);

  const requester = requesterMap.get(ticket.user_id);
  const authorIds = Array.from(new Set(replies.map((r) => r.user_id)));
  const authors = await getProfilesByIds(authorIds);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mono-label text-muted">
              Ticket #{ticket.id} · opened by {requester?.full_name ?? "unknown"}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
              {ticket.subject}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PriorityChip priority={ticket.priority} />
            <StatusChip status={ticket.status} />
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm text-ink-2">{ticket.body}</p>
      </div>

      {staff && (
        <div className="flex flex-wrap gap-4 rounded-[var(--radius-md)] border border-rule bg-paper-2 p-4">
          <div className="w-44">
            <StatusControl ticketId={ticket.id} status={ticket.status} />
          </div>
          <div className="w-56">
            <AssignControl
              ticketId={ticket.id}
              assignedTo={ticket.assigned_to}
              staff={staffMembers}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          {replies.length === 0 ? "No replies yet" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
        </h2>

        {replies.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-[var(--radius-md)] border p-4",
              r.is_internal
                ? "border-[var(--color-warn)] bg-[var(--color-warn-soft)]"
                : "border-rule",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">
                {authors.get(r.user_id)?.full_name ?? "Unknown"}
              </p>
              <div className="flex items-center gap-2">
                {r.is_internal && (
                  <span className="mono-label text-[var(--color-warn)]">Internal</span>
                )}
                <span className="text-xs text-muted">{formatDateTime(r.created_at)}</span>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-2">{r.body}</p>
          </div>
        ))}
      </div>

      <ReplyForm ticketId={ticket.id} canReplyInternal={canReplyInternal(user.role)} />
    </div>
  );
}
