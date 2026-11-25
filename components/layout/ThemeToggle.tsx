"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";

type Mode = "auto" | "light" | "dark";
const ORDER: Mode[] = ["auto", "light", "dark"];
const LABEL: Record<Mode, string> = {
  auto: "Theme: automatic, dark for parts and light for reading",
  light: "Theme: light",
  dark: "Theme: dark",
};

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => obs.disconnect();
}
const getMode = (): Mode => (document.documentElement.dataset.mode as Mode) ?? "auto";

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "auto" as Mode);
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]!;
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.mode = next;
        try {
          if (next === "auto") localStorage.removeItem("assay-theme");
          else localStorage.setItem("assay-theme", next);
        } catch {
          // Storage can be unavailable in private modes; the choice still applies to this page.
        }
      }}
      aria-label={`${LABEL[mode]}. Switch to ${next}.`}
      title={LABEL[mode]}
      className="inline-flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors duration-200 ease-out hover:bg-bg-subtle hover:text-fg active:scale-95"
    >
      <Icon name={mode === "auto" ? "auto" : mode === "light" ? "sun" : "moon"} />
    </button>
  );
}
