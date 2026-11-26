/** Option lists and link helpers shared by every part configurator. */

export type Option = { id: string; label: string; note?: string };
export const o = (id: string, label: string, note?: string): Option => ({ id, label, note });

export const ORIGIN = [
  o("O0", "No requirement"),
  o("O1", "Assembled in India", "Final assembly and test in India. Parts may be imported."),
  o("O2", "Made in India, key parts declared", "Main parts made in India. The makers of critical materials and chips named in writing."),
  o("O3", "China-free, documented", "No Chinese magnets, wire, bearings, chips or laminates, with documents to the raw material."),
];
export const EVIDENCE = [
  o("T1", "Tier 1: documents", "Datasheet and origin declarations matched to the code."),
  o("T2", "Tier 2: sample inspected", "We measure a sample from your batch against the spec."),
  o("T3", "Tier 3: lab tested", "An outside lab tests a sample and we attach the report."),
];

export const labelOf = (list: Option[], id: string) => list.find((x) => x.id === id)?.label ?? id;

/** Reads one option id from a link, falling back when it is missing or unknown. */
export function pickId(v: string | null, list: Option[], fallback: string): string {
  return v && list.some((x) => x.id === v) ? v : fallback;
}

/** Reads a number from a link, within limits. */
export function pickNum(v: string | null, min: number, max: number, fallback: number, step = 1): number {
  const n = Number(v);
  if (v === null || v === "" || !Number.isFinite(n) || n < min || n > max) return fallback;
  return Math.round(n / step) * step;
}
