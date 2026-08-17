"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createTicketSchema } from "@/lib/validation";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ApiError, TicketPriority } from "@/lib/types";

export function NewTicketForm({ quota }: { quota: { used: number; limit: number } }) {
  const router = useRouter();
  const { push } = useToast();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const atLimit = quota.used >= quota.limit;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = createTicketSchema.safeParse({ subject, body, priority });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) if (v?.[0]) next[k] = v[0];
      setFieldErrors(next);
      return;
    }

    setState("loading");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.status === 201) {
      const { data } = await res.json();
      push("Ticket created.", "success");
      router.push(`/tickets/${data.id}`);
      return;
    }

    const payload = (await res.json().catch(() => null)) as ApiError | null;
    setState("error");

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const minutes = retryAfter ? Math.ceil(Number(retryAfter) / 60) : null;
      setFormError(
        minutes
          ? `You've hit the ticket limit for this hour. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`
          : "You've hit the ticket limit for this hour. Try again shortly.",
      );
      return;
    }

    setFormError(payload?.error.message ?? "Something went wrong. Try again.");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-5">
      {atLimit && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-[var(--color-warn)] bg-[var(--color-warn-soft)] px-3 py-2 text-sm text-[var(--color-warn)]"
        >
          You&apos;ve reached the {quota.limit}-ticket-per-hour limit. New tickets will
          be rejected until older ones age out of the window.
        </p>
      )}
      {formError && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {formError}
        </p>
      )}

      <Field label="Subject" htmlFor="subject" error={fieldErrors.subject}>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          invalid={!!fieldErrors.subject}
          disabled={state === "loading"}
          maxLength={200}
        />
      </Field>

      <Field label="Priority" htmlFor="priority">
        <Select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
          disabled={state === "loading"}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </Field>

      <Field label="Description" htmlFor="body" error={fieldErrors.body}>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          invalid={!!fieldErrors.body}
          disabled={state === "loading"}
          maxLength={5000}
          rows={6}
        />
      </Field>

      <Button
        type="submit"
        state={state === "loading" ? "loading" : "idle"}
        disabled={atLimit}
        className="self-start"
      >
        Create ticket
      </Button>
    </form>
  );
}
