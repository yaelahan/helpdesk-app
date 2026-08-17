"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");

  function set<K extends keyof typeof values>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) if (v?.[0]) next[k] = v[0];
      setFieldErrors(next);
      return;
    }

    setState("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/confirm`
            : undefined,
      },
    });

    if (error) {
      setState("error");
      setFormError(
        error.message.toLowerCase().includes("already")
          ? "An account with that email already exists."
          : error.message,
      );
      return;
    }

    setState("success");
  }

  if (state === "success") {
    return (
      <div className="reveal is-in flex flex-col gap-4">
        <p className="mono-label text-accent">Almost there</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Check your email</h1>
        <p className="text-sm text-ink-2">
          We sent a confirmation link to <strong>{values.email}</strong>. Running
          locally? Open the mail catcher at{" "}
          <a
            href="http://localhost:54324"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            localhost:54324
          </a>
          .
        </p>
        <Link href="/login" className="text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="reveal is-in flex flex-col gap-5">
      <div>
        <p className="mono-label text-accent">Create account</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Get started
        </h1>
      </div>

      {formError && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      )}

      <Field label="Full name" htmlFor="fullName" error={fieldErrors.fullName}>
        <Input
          id="fullName"
          autoComplete="name"
          value={values.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          invalid={!!fieldErrors.fullName}
          disabled={state === "loading"}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          invalid={!!fieldErrors.email}
          disabled={state === "loading"}
        />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 8 characters" error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
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
          onChange={(e) => set("confirmPassword", e.target.value)}
          invalid={!!fieldErrors.confirmPassword}
          disabled={state === "loading"}
        />
      </Field>

      <Button type="submit" state={state === "loading" ? "loading" : "idle"} className="mt-1">
        Create account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
