import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonState = "idle" | "loading" | "error" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  state?: ButtonState;
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-accent-ink border border-accent hover:bg-[color-mix(in_oklch,var(--color-accent)_88%,black)] active:bg-[color-mix(in_oklch,var(--color-accent)_78%,black)]",
  secondary:
    "bg-paper text-ink border border-rule-2 hover:border-accent hover:text-accent active:bg-paper-2",
  ghost:
    "bg-transparent text-ink-2 border border-transparent hover:bg-paper-2 active:bg-paper-3",
  danger:
    "bg-paper text-[var(--color-danger)] border border-[var(--color-danger)]/40 hover:bg-[var(--color-danger-soft)] active:bg-[var(--color-danger-soft)]",
};

const STATE_LABEL: Record<Exclude<ButtonState, "idle">, string> = {
  loading: "Working…",
  error: "Try again",
  success: "Done",
};

export function Button({
  variant = "primary",
  state = "idle",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isBusy = state === "loading";

  return (
    <button
      type="button"
      disabled={disabled || isBusy}
      data-state={state}
      aria-busy={isBusy || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium whitespace-nowrap",
        "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASS[variant],
        state === "error" && "!border-[var(--color-danger)] !text-[var(--color-danger)]",
        state === "success" && "!border-[var(--color-success)] !text-[var(--color-success)]",
        className,
      )}
      {...props}
    >
      {isBusy && (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
        />
      )}
      {state === "idle" ? children : STATE_LABEL[state]}
    </button>
  );
}
