"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "info" | "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ToastContext = createContext<{
  push: (message: string, variant?: ToastVariant) => void;
} | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-0 bottom-4 z-[var(--z-overlay)] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "reveal is-in flex w-full max-w-sm items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm shadow-[0_1px_2px_oklch(24%_0.02_258_/_0.08)]",
              t.variant === "error" &&
                "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
              t.variant === "success" &&
                "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
              t.variant === "info" && "border-rule-2 bg-paper text-ink",
            )}
          >
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded-[var(--radius-sm)] px-1 text-current/70 hover:text-current focus-visible:outline-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
