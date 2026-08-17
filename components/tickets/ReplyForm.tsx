"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createReplySchema } from "@/lib/validation";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ApiError } from "@/lib/types";

export function ReplyForm({ ticketId, canReplyInternal }: { ticketId: number; canReplyInternal: boolean }) {
  const router = useRouter();
  const { push } = useToast();

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createReplySchema.safeParse({ body, isInternal });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.body?.[0] ?? "Reply cannot be empty.");
      return;
    }

    setState("loading");
    const res = await fetch(`/api/tickets/${ticketId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.status === 201) {
      setBody("");
      setIsInternal(false);
      setState("idle");
      push("Reply posted.", "success");
      router.refresh();
      return;
    }

    const payload = (await res.json().catch(() => null)) as ApiError | null;
    setState("error");
    setError(payload?.error.message ?? "Couldn't post the reply.");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <Textarea
        aria-label="Reply"
        placeholder={isInternal ? "Internal note -- customer won't see this…" : "Write a reply…"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        invalid={!!error}
        disabled={state === "loading"}
        rows={4}
        className={isInternal ? "border-[var(--color-warn)] bg-[var(--color-warn-soft)]" : undefined}
      />
      <div className="flex items-center justify-between gap-3">
        {canReplyInternal ? (
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="size-4 rounded-[4px] border-rule-2 accent-[var(--color-warn)]"
            />
            Internal note (admins only)
          </label>
        ) : (
          <span />
        )}
        <Button type="submit" state={state === "loading" ? "loading" : "idle"}>
          Post reply
        </Button>
      </div>
    </form>
  );
}
