"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validation";
import type { ApiError } from "@/lib/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const linkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0] ?? "", password: flat.password?.[0] ?? "" });
      return;
    }

    setState("loading");
    // Goes through our own route rather than straight to Supabase, so the
    // attempt passes a rate limiter we control. See app/api/auth/login.
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }

    setState("error");

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After"));
      const minutes = Number.isFinite(retryAfter) ? Math.ceil(retryAfter / 60) : null;
      setFormError(
        minutes
          ? `Too many sign-in attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`
          : "Too many sign-in attempts. Try again shortly.",
      );
      return;
    }

    const payload = (await res.json().catch(() => null)) as ApiError | null;
    setFormError(payload?.error.message ?? "Invalid email or password.");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="reveal is-in flex flex-col gap-5">
      <div>
        <p className="mono-label text-accent">Sign in</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Welcome back
        </h1>
      </div>

      {linkError && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          That link is invalid or has expired.
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {formError}
        </p>
      )}

      <Field label="Email" htmlFor="email" error={fieldErrors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={!!fieldErrors.email}
          disabled={state === "loading"}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={!!fieldErrors.password}
          disabled={state === "loading"}
        />
      </Field>

      <Button type="submit" state={state === "loading" ? "loading" : "idle"} className="mt-1">
        Sign in
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="text-muted hover:text-ink">
          Create account
        </Link>
      </div>

      {/* Shown always, never conditionally. The sign-in error is deliberately
          identical for a wrong password, an unknown address, and an
          unconfirmed one, so this is how a real user learns what to check
          without the form confirming which emails exist. */}
      <p className="border-t border-rule pt-4 text-xs text-muted">
        Just registered? Check your inbox for the confirmation link before
        signing in.
      </p>
    </form>
  );
}
