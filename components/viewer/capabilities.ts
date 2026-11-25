"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type GlCapability = "unknown" | "ok" | "no-webgl" | "low-power";

let cached: GlCapability | null = null;

function detect(): GlCapability {
  if (cached) return cached;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return (cached = "no-webgl");
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return (cached = "no-webgl");
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;
  if (nav.connection?.saveData || lowMemory || fewCores) return (cached = "low-power");
  return (cached = "ok");
}

const noop = () => () => {};

/** WebGL support and a conservative low-power check. "unknown" during SSR. */
export function useGlCapability(): GlCapability {
  return useSyncExternalStore(noop, detect, () => "unknown");
}

function mediaHook(query: string) {
  const subscribe = (cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  };
  return () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

export const useReducedMotionPref = mediaHook("(prefers-reduced-motion: reduce)");
export const useIsMobile = mediaHook("(max-width: 767px), (pointer: coarse)");

/**
 * Defers heavy work (the three.js chunk) until the visitor interacts with the page or the
 * browser has been idle for timeoutMs milliseconds. Keeps first paint and input responsiveness fast.
 */
export function useDeferredLoad(enabled: boolean, timeoutMs = 4000): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;
    let idle = 0;
    const go = () => {
      cleanup();
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true), { timeout: 800 });
      else setReady(true);
    };
    const timer = window.setTimeout(go, timeoutMs);
    events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    function cleanup() {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, go));
    }
    return () => {
      cleanup();
      (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idle);
    };
  }, [enabled, ready, timeoutMs]);
  return ready;
}