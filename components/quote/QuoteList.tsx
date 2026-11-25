"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useQuote } from "@/lib/quote";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/components/forms/Field";
import { cn } from "@/lib/cn";

const noop = () => () => {};

export function QuoteList() {
  const quote = useQuote();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  if (!hydrated) return <div className="min-h-40" aria-hidden="true" />;

  if (quote.lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
        <Icon name="tray" size={24} className="mx-auto text-fg-subtle" />
        <p className="mt-4 font-medium">Your quote list is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-subtle">Add parts from any part page, or paste a whole bill of materials into the BOM checker.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LinkButton href="/parts">Browse parts</LinkButton>
          <LinkButton href="/bom" variant="secondary">
            Check a BOM
          </LinkButton>
        </div>
      </div>
    );
  }

  const units = quote.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div>
      <ul className="divide-y divide-line border-y border-line">
        {quote.lines.map((l) => (
          <li key={l.code} className="grid grid-cols-1 items-center gap-3 py-4 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <Link href={`/parts/${l.id}`} className="font-medium hover:text-accent">
                {l.name}
              </Link>
              <p className="code-text mt-0.5 text-xs text-fg-subtle">{l.code}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-fg-subtle sm:col-span-3">
              Quantity
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={l.quantity}
                onChange={(e) => quote.setQuantity(l.code, Number(e.target.value))}
                className={cn(inputClass, "tabular h-11 w-28 border-line text-fg")}
              />
            </label>
            <div className="sm:col-span-2 sm:text-right">
              <button
                type="button"
                onClick={() => quote.remove(l.code)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-fg-subtle hover:bg-bg-subtle hover:text-fg"
                aria-label={`Remove ${l.name}`}
              >
                <Icon name="close" size={14} /> Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="tabular text-sm text-fg-muted">
          {quote.lines.length} {quote.lines.length === 1 ? "part" : "parts"}, {units} units in total
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={quote.clear} className="min-h-11 rounded-full px-4 text-sm text-fg-subtle hover:bg-bg-subtle hover:text-fg">
            Clear list
          </button>
          <LinkButton href="/request?from=quote">Send as one request</LinkButton>
        </div>
      </div>
    </div>
  );
}
