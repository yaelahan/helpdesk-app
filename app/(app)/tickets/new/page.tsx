import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/roles";
import { getTicketQuota } from "@/lib/data/tickets";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";

export const metadata: Metadata = { title: "New ticket · HelpdeskApp" };

export default async function NewTicketPage() {
  const user = await getSessionUser();
  if (!user) return null;

  // Hiding the nav link is cosmetic; the route has to refuse staff as well.
  // create_ticket() files against auth.uid(), so a staff-raised ticket would
  // land in the queue owned by the person meant to be answering it.
  if (isStaff(user.role)) redirect("/tickets");

  const quota = await getTicketQuota(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mono-label text-accent">New ticket</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          What&apos;s going on?
        </h1>
      </div>
      <NewTicketForm quota={quota} />
    </div>
  );
}
