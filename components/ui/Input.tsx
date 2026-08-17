import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-[var(--radius-sm)] border bg-paper px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
  "disabled:cursor-not-allowed disabled:bg-paper-2 disabled:text-muted";

function fieldStateClass(invalid?: boolean) {
  return invalid
    ? "border-[var(--color-danger)] focus-visible:outline-[var(--color-danger)]"
    : "border-rule-2 hover:border-[var(--color-ink-2)]/40 focus-visible:border-accent";
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, fieldStateClass(invalid), className)}
      {...props}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, fieldStateClass(invalid), "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, fieldStateClass(invalid), "cursor-pointer", className)}
      {...props}
    >
      {children}
    </select>
  );
}
