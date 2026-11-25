"use client";

/**
 * Quote list: parts a buyer collects while browsing, kept in localStorage on their
 * device only. Nothing is sent until they submit the request form.
 */
import { useSyncExternalStore } from "react";

export type QuoteLine = { code: string; id: string; name: string; quantity: number };

const KEY = "verkod.quote.v1";
const EVENT = "verkod-quote-change";
const EMPTY: QuoteLine[] = [];

let cache: { raw: string | null; lines: QuoteLine[] } = { raw: null, lines: EMPTY };

function read(): QuoteLine[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: QuoteLine[] = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as QuoteLine[]) : [];
    lines = Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.code === "string" && l.quantity > 0) : [];
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: QuoteLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage full or blocked: the list simply does not persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useQuote() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    lines,
    count: lines.length,
    has: (code: string) => lines.some((l) => l.code === code),
    add: (line: Omit<QuoteLine, "quantity">, quantity = 1) => {
      const cur = read();
      const found = cur.find((l) => l.code === line.code);
      write(found ? cur.map((l) => (l.code === line.code ? { ...l, quantity: l.quantity + quantity } : l)) : [...cur, { ...line, quantity }]);
    },
    setQuantity: (code: string, quantity: number) => {
      const q = Math.max(1, Math.min(1_000_000, Math.round(quantity) || 1));
      write(read().map((l) => (l.code === code ? { ...l, quantity: q } : l)));
    },
    remove: (code: string) => write(read().filter((l) => l.code !== code)),
    clear: () => write([]),
  };
}

/** Text for the request form's parts field, one line per part. */
export function quoteToText(lines: QuoteLine[]): string {
  return lines.map((l) => `${l.code}  x${l.quantity}  ${l.name}`).join("\n");
}

export function readQuoteText(): string | null {
  const lines = read();
  return lines.length ? quoteToText(lines) : null;
}

export function readQuoteUnits(): string {
  const n = read().reduce((s, l) => s + l.quantity, 0);
  return n ? String(n) : "";
}
