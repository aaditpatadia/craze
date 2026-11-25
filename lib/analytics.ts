/**
 * Privacy-friendly analytics. Uses Plausible when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set,
 * otherwise does nothing. No cookies, no personal data in event properties.
 */
export type AnalyticsEvent =
  | "Part opened"
  | "Explode used"
  | "BOM uploaded"
  | "Request submitted"
  | "Notify submitted"
  | "Supplier applied"
  | "Code copied"
  | "Quote add";

type Plausible = (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const p = (window as unknown as { plausible?: Plausible }).plausible;
  if (typeof p === "function") p(event, props ? { props } : undefined);
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, props ?? {});
}
