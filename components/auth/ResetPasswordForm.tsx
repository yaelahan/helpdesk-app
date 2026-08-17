"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm() {
  const router = useRouter();
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) if (v?.[0]) next[k] = v[0];
      setFieldErrors(next);
      return;
    }

    setState("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      setState("idle");
      setFormError(
        "Couldn't update your password. The reset link may have expired -- request a new one.",
      );
      return;
    }

    setState("success");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (state === "success") {
    return (
      <div className="reveal is-in flex flex-col gap-3">
        <p className="mono-label text-[var(--color-success)]">Password updated</p>
        <h1 className="font-display text-2xl font-semibold text-ink">You&apos;re all set</h1>
        <p className="text-sm text-ink-2">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="reveal is-in flex flex-col gap-5">
      <div>
        <p className="mono-label text-accent">Reset password</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Choose a new password
        </h1>
      </div>

      {formError && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      )}

      <Field label="New password" htmlFor="password" hint="At least 8 characters" error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          invalid={!!fieldErrors.password}
          disabled={state === "loading"}
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
          invalid={!!fieldErrors.confirmPassword}
          disabled={state === "loading"}
        />
      </Field>

      <Button type="submit" state={state === "loading" ? "loading" : "idle"} className="mt-1">
        Update password
      </Button>
    </form>
  );
}
