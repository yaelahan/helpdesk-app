"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/lib/validation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(undefined);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0]);
      return;
    }

    setState("loading");
    const supabase = createClient();
    // Intentionally ignore the result. Supabase returns the same response
    // whether or not the address is registered -- surfacing that result
    // (or a network error) verbatim would leak account existence. Always
    // show the identical success message; see README on user enumeration.
    // The reset link's destination is baked into
    // supabase/templates/recovery.html, not passed from here.
    await supabase.auth.resetPasswordForEmail(parsed.data.email);

    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="reveal is-in flex flex-col gap-4">
        <p className="mono-label text-accent">Check your email</p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Reset link on its way
        </h1>
        <p className="text-sm text-ink-2">
          If an account exists for that address, we&apos;ve sent a link to reset
          the password. Running locally? Open the mail catcher at{" "}
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
        <p className="mono-label text-accent">Reset password</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Enter your email and we&apos;ll send a link to reset it.
        </p>
      </div>

      <Field label="Email" htmlFor="email" error={fieldError}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={!!fieldError}
          disabled={state === "loading"}
        />
      </Field>

      <Button type="submit" state={state === "loading" ? "loading" : "idle"} className="mt-1">
        Send reset link
      </Button>

      <Link href="/login" className="text-center text-sm text-muted hover:text-ink">
        Back to sign in
      </Link>
    </form>
  );
}
