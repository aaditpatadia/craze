import { STALE_AFTER_MONTHS } from "./config";
import { ORIGIN_NOT_VERIFIED, ORIGIN_UNKNOWN } from "./constants";
import type { Tier, ModelSource } from "./schema";

export const TIER_LABEL: Record<Tier, string> = {
  1: "Documents received",
  2: "Sample inspected",
  3: "Independently tested",
};

export const TIER_SHORT: Record<Tier, string> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
};

export const MODEL_SOURCE_LABEL: Record<ModelSource, string> = {
  "supplier-cad": "Supplier CAD",
  "scanned-sample": "Scanned sample",
  illustrative: "Illustrative model",
};

export const LAYER_LABEL = {
  all: "All parts",
  moving: "Moving parts",
  electrical: "Electrical",
  magnetic: "Magnetic",
  structural: "Structural",
} as const;

export function originLabel(country: string): string {
  if (country === ORIGIN_UNKNOWN) return "Unknown";
  if (country === ORIGIN_NOT_VERIFIED) return "Not yet verified";
  return country;
}

export function isOriginKnown(country: string): boolean {
  return country !== ORIGIN_UNKNOWN && country !== ORIGIN_NOT_VERIFIED;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function monthsSince(iso: string, now: Date = new Date()): number {
  const d = new Date(`${iso}T00:00:00Z`);
  return (now.getUTCFullYear() - d.getUTCFullYear()) * 12 + (now.getUTCMonth() - d.getUTCMonth()) - (now.getUTCDate() < d.getUTCDate() ? 1 : 0);
}

export function isStale(iso: string, now: Date = new Date()): boolean {
  return monthsSince(iso, now) >= STALE_AFTER_MONTHS;
}

export function formatSpecValue(value: number | string, unit: string | null): string {
  const v = typeof value === "number" ? value.toLocaleString("en-GB") : value;
  return unit ? `${v} ${unit}` : v;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
