"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Reads the URL query without opting the page out of static rendering.
 * The server and the hydration pass see no query; the real query applies right after,
 * on the same DOM, so there is no fallback swap and no layout shift.
 * Writes use history.replaceState, which the Next.js router keeps in sync.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

export function useUrlSearch(): [URLSearchParams, (next: URLSearchParams) => void] {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const replace = (next: URLSearchParams) => {
    const qs = next.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    listeners.forEach((l) => l());
  };
  return [params, replace];
}
