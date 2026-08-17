import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getTickets, getTicketQuota } from "@/lib/data/tickets";
import { isAdmin } from "@/lib/auth/roles";
import { StatusChip, PriorityChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { TicketStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard · HelpdeskApp" };

const STATUS_ORDER: TicketStatus[] = ["open", "pending", "resolved", "closed"];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [tickets, quota] = await Promise.all([getTickets(), getTicketQuota(user.id)]);
  const admin = isAdmin(user.role);

  const counts = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = tickets.filter((t) => t.status === status).length;
      return acc;
    },
    {} as Record<TicketStatus, number>,
  );

  const recent = tickets.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mono-label text-accent">
          {admin ? "Queue overview" : "Your tickets"}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Welcome back, {user.fullName?.split(" ")[0] ?? "there"}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-[var(--radius-md)] border border-rule p-4">
            <p className="font-display text-2xl font-semibold text-ink tabular-nums">
              {counts[status]}
            </p>
            <div className="mt-2">
              <StatusChip status={status} />
            </div>
          </div>
        ))}
      </div>

      {!admin && (
        <div className="rounded-[var(--radius-md)] border border-rule-2 bg-paper-2 px-4 py-3 text-sm text-ink-2">
          <span className="font-medium text-ink">{quota.used} / {quota.limit}</span>{" "}
          tickets created in the last hour.
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent</h2>
          <Link href="/tickets" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description={
              admin ? "Nothing in the queue right now." : "Create your first support ticket."
            }
            action={
              !admin && (
                <Link href="/tickets/new">
                  <Button>New ticket</Button>
                </Link>
              )
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-rule">
            {recent.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-paper-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-ink">
                    {t.subject}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <PriorityChip priority={t.priority} />
                    <StatusChip status={t.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
