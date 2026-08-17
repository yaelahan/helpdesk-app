"use client";

import { useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/icons";

type Theme = "light" | "dark";

/**
 * The theme lives outside React -- a data-theme attribute set by the pre-paint
 * script in app/layout.tsx, backed by localStorage and the OS preference. That
 * makes it an external store, so it is read with useSyncExternalStore rather
 * than mirrored into state inside an effect: no setState-in-effect, and no
 * flash of the wrong icon because the server snapshot is explicit.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// No document on the server; the real value is resolved on hydration.
const getServerSnapshot = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode / blocked storage: the choice just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-rule-2 text-ink-2 transition-colors duration-[var(--dur-fast)] hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
