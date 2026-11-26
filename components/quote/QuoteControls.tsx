"use client";

import Link from "next/link";
import { useState } from "react";
import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { useQuote } from "@/lib/quote";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** A TM code with a copy button. The code is the thing buyers and suppliers both quote. */
export function CodeChip({ code, size = "md", className }: { code: string; size?: "sm" | "md"; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      track("Code copied", { code });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the code is still selectable text */
    }
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-line-strong/70 bg-bg-subtle pl-2.5 text-fg",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span className="code-text select-all font-medium">{code}</span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex size-9 items-center justify-center rounded-md text-fg-subtle hover:text-fg"
        aria-label={copied ? `Copied ${code}` : `Copy code ${code}`}
      >
        <Icon name={copied ? "check" : "copy"} size={14} />
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}

export function AddToQuote({ code, id, name, className }: { code: string; id: string; name: string; className?: string }) {
  const quote = useQuote();
  const hydrated = useHydrated();
  const inList = hydrated && quote.has(code);
  if (inList) {
    return (
      <Link
        href="/quote"
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong/60 px-5 text-sm font-medium text-fg hover:bg-bg-subtle",
          className,
        )}
      >
        <Icon name="check" size={16} /> In quote list
      </Link>
    );
  }
  return (
    <Button
      variant="secondary"
      className={className}
      onClick={() => {
        quote.add({ code, id, name });
        track("Quote add", { code });
      }}
    >
      <Icon name="plus" size={16} /> Add to quote list
    </Button>
  );
}

export function QuoteBadge() {
  const { count } = useQuote();
  const hydrated = useHydrated();
  const n = hydrated ? count : 0;
  return (
    <Link
      href="/quote"
      className="relative inline-flex size-11 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle hover:text-fg"
      aria-label={n ? `Quote list, ${n} ${n === 1 ? "part" : "parts"}` : "Quote list, empty"}
    >
      <Icon name="tray" />
      {n ? (
        <span className="tabular absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-white">
          {n}
        </span>
      ) : null}
    </Link>
  );
}
