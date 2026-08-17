import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getTicketQuota } from "@/lib/data/tickets";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";

export const metadata: Metadata = { title: "New ticket · HelpdeskApp" };

export default async function NewTicketPage() {
  const user = await getSessionUser();
  if (!user) return null;

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
