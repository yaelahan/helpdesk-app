import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getTickets, getProfilesByIds } from "@/lib/data/tickets";
import { isStaff } from "@/lib/auth/roles";
import { StatusChip, PriorityChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Table, TableHead, TableHeadCell, TableRow, TableCell } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Tickets · HelpdeskApp" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function TicketsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const staff = isStaff(user.role);
  const tickets = await getTickets();

  const requesterIds = staff ? Array.from(new Set(tickets.map((t) => t.user_id))) : [];
  const requesters = staff ? await getProfilesByIds(requesterIds) : new Map();

  return (
    <div className="flex flex-col gap-6">
      {/* S2 hanging: heading floats above with no eyebrow-beside-heading grid (gate 54). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {staff ? "Queue" : "My tickets"}
        </h1>
        <Link href="/tickets/new">
          <Button>New ticket</Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description={staff ? "The queue is empty." : "You haven't opened a ticket yet."}
          action={
            <Link href="/tickets/new">
              <Button>New ticket</Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Subject</TableHeadCell>
              {staff && <TableHeadCell>Requester</TableHeadCell>}
              <TableHeadCell>Priority</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Opened</TableHeadCell>
            </tr>
          </TableHead>
          <tbody>
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link
                    href={`/tickets/${t.id}`}
                    className="font-medium text-ink hover:text-accent hover:underline"
                  >
                    {t.subject}
                  </Link>
                </TableCell>
                {staff && (
                  <TableCell className="text-muted">
                    {requesters.get(t.user_id)?.full_name ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <PriorityChip priority={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusChip status={t.status} />
                </TableCell>
                <TableCell className="text-right text-muted">
                  {formatDate(t.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
