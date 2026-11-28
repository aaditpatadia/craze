/**
 * Live numbers for the evidence dashboard, the investors page and the founder desk. Server only.
 * Every number is counted from real records: the catalogue, the verification log and the cases
 * buyers have opened. Nothing is estimated or typed in by hand.
 */
import { getCatalog } from "./content";
import { CHECK_KINDS, codesIn, type Case, type Check } from "./pipeline";
import { listRecords } from "./store";

export const baseCode = (c: string) => c.trim().toUpperCase().replace(/-[A-Z]$/, "");

export const getChecks = () => listRecords<Check>("checks/");
export const getCases = () => listRecords<Case>("cases/");

export type EvidenceStats = {
  parts: number;
  byTier: [number, number, number, number];
  checks: number;
  samples30: number;
  labReports: number;
  batches: number;
  failures: number;
  partsChecked: number;
  lastCheck: string | null;
  /** Median days from a part's first document review to its first sample measurement. */
  medianDaysToSample: number | null;
  perPart: { code: string; name: string; id: string; tier: number; checks: number; last: string | null }[];
};

const tierOf = (k: string) => CHECK_KINDS.find((c) => c.id === k)?.tier ?? 0;

export function evidenceStats(checks: Check[], now = Date.now()): EvidenceStats {
  const catalog = getCatalog();
  const byCode = new Map<string, Check[]>();
  for (const c of checks) {
    const k = baseCode(c.code);
    byCode.set(k, [...(byCode.get(k) ?? []), c]);
  }
  const perPart = catalog.map((p) => {
    const mine = byCode.get(baseCode(p.code)) ?? [];
    const logged = Math.max(0, ...mine.filter((c) => c.result !== "fail").map((c) => tierOf(c.kind)));
    return {
      code: p.code,
      name: p.name,
      id: p.id,
      tier: Math.max(p.highestTier, logged),
      checks: mine.length,
      last: mine.map((c) => c.date).sort().at(-1) ?? null,
    };
  });
  const byTier: [number, number, number, number] = [0, 0, 0, 0];
  for (const p of perPart) byTier[Math.min(3, Math.max(0, p.tier))]!++;
  const days: number[] = [];
  for (const list of byCode.values()) {
    const doc = list.filter((c) => c.kind === "documents").map((c) => c.date).sort()[0];
    const sample = list.filter((c) => c.kind === "sample").map((c) => c.date).sort()[0];
    if (doc && sample && sample >= doc) days.push((Date.parse(sample) - Date.parse(doc)) / 86_400_000);
  }
  days.sort((a, b) => a - b);
  return {
    parts: catalog.length,
    byTier,
    checks: checks.length,
    samples30: checks.filter((c) => c.kind === "sample" && now - Date.parse(c.date) <= 30 * 86_400_000).length,
    labReports: checks.filter((c) => c.kind === "lab").length,
    batches: checks.filter((c) => c.kind === "batch").length,
    failures: checks.filter((c) => c.result === "fail").length,
    partsChecked: perPart.filter((p) => p.checks > 0).length,
    lastCheck: checks.map((c) => c.date).sort().at(-1) ?? null,
    medianDaysToSample: days.length ? Math.round(days[Math.floor(days.length / 2)]!) : null,
    perPart,
  };
}

export type Traction = {
  requests: number;
  lois: number;
  buyers: number;
  unitsReserved: number;
  ordered: number;
  delivered: number;
  demand: { code: string; cases: number; units: number }[];
};

const AFTER_ORDER = ["ordered", "production", "tested", "dispatched", "delivered"];

export function traction(cases: Case[]): Traction {
  const demand = new Map<string, { cases: number; units: number }>();
  for (const c of cases) {
    const items = c.items.length ? c.items : codesIn(c.summary).map((code) => ({ code, qty: 0 }));
    for (const it of items) {
      const k = baseCode(it.code);
      const d = demand.get(k) ?? { cases: 0, units: 0 };
      d.cases++;
      d.units += it.qty || 0;
      demand.set(k, d);
    }
  }
  return {
    requests: cases.filter((c) => c.kind === "request").length,
    lois: cases.filter((c) => c.kind === "loi" || c.history.some((h) => h.status === "loi")).length,
    buyers: new Set(cases.map((c) => c.contact.company.trim().toLowerCase())).size,
    unitsReserved: cases.filter((c) => c.kind === "loi").reduce((s, c) => s + c.items.reduce((a, i) => a + (i.qty || 0), 0), 0),
    ordered: cases.filter((c) => AFTER_ORDER.includes(c.status)).length,
    delivered: cases.filter((c) => c.status === "delivered").length,
    demand: [...demand.entries()].map(([code, d]) => ({ code, ...d })).sort((a, b) => b.cases - a.cases || b.units - a.units),
  };
}
