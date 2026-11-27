/**
 * Indigenous content calculator. Runs in the browser: nothing the buyer pastes leaves the page.
 *
 * Method: cost-based, as in the Defence Acquisition Procedure (DAP 2020), where indigenous
 * content is the share of the cost that is not imported. Each row carries an Indian share
 * from 0 to 100 percent, so an assembly made in India with imported magnets counts in part.
 * Unknown origin counts as imported, because that is how an auditor treats it.
 * This is a planning estimate, not a certificate.
 */
import { parseDelimited } from "./bom";
import type { CatalogItem } from "./content";
import { matchRows } from "./bom";
import { CELL_VOLTS, FRAMES } from "./motor-config";
import { CONT_AMPS } from "./esc-config";
import { DIAMETERS } from "./prop-config";

export type Origin = "IN" | "PART" | "IMP" | "UNK";
export const ORIGIN_LABEL: Record<Origin, string> = {
  IN: "Made in India",
  PART: "Part Indian",
  IMP: "Imported",
  UNK: "Not known",
};
/** Indian share assumed for each origin when the buyer does not give one. */
export const DEFAULT_SHARE: Record<Origin, number> = { IN: 100, PART: 50, IMP: 0, UNK: 0 };

export type Group = "motor" | "esc" | "prop" | "fc" | "gnss" | "radio" | "camera" | "battery" | "frame" | "wiring" | "other";
export const GROUP_LABEL: Record<Group, string> = {
  motor: "Motor",
  esc: "ESC",
  prop: "Propeller",
  fc: "Flight controller",
  gnss: "GNSS",
  radio: "Radio and datalink",
  camera: "Camera and gimbal",
  battery: "Battery",
  frame: "Airframe",
  wiring: "Wiring and connectors",
  other: "Other",
};
/** Parts defence buyers treat as critical: a foreign one here is flagged on its own, whatever the score. */
export const CRITICAL: Group[] = ["motor", "esc", "fc", "gnss", "radio", "camera", "battery"];

const GROUP_WORDS: [Group, RegExp][] = [
  ["esc", /\b(esc|escs|speed controller|4.?in.?1)\b/i],
  ["motor", /\b(motor|bldc|brushless|outrunner|\d{4,5}\s*-?\s*\d{2,4}\s*kv|\d{2,4}\s*kv)\b/i],
  ["prop", /\b(prop|props|propeller|propellers|blade)\b/i],
  ["fc", /\b(flight controller|autopilot|fc|pixhawk|cube|h7|f7|f4|imu)\b/i],
  ["gnss", /\b(gnss|gps|rtk|compass|navic)\b/i],
  ["radio", /\b(radio|telemetry|datalink|data link|receiver|rx|tx|transmitter|elrs|crsf|vtx|video transmitter|mesh|lte|modem|antenna)\b/i],
  ["camera", /\b(camera|gimbal|eo|ir|thermal|payload camera|lens|fpv cam)\b/i],
  ["battery", /\b(battery|lipo|li-?ion|cell|cells|pack|mah)\b/i],
  ["frame", /\b(frame|arm|arms|airframe|landing gear|fuselage|wing|boom|plate)\b/i],
  ["wiring", /\b(wire|wiring|cable|connector|xt60|xt90|as150|harness|pdb|bec)\b/i],
];

export function groupOf(text: string): Group {
  for (const [g, re] of GROUP_WORDS) if (re.test(text)) return g;
  return "other";
}

export type IcRow = {
  id: number;
  part: string;
  qty: number;
  unitCost: number;
  origin: Origin;
  /** Indian share of this row's cost, 0 to 100. */
  share: number;
  group: Group;
  /** Buyer ticked "replace with the Timule part" for the what-if. */
  replace: boolean;
};

const H = {
  part: /^(part|item|description|name|component|part name|part number|mpn)$/i,
  qty: /^(qty|quantity|count|units|q'?ty|nos)$/i,
  cost: /^(unit cost|unit price|cost|price|rate|unit rate|inr|rs|value)$/i,
  origin: /^(origin|country|made in|country of origin|source|coo)$/i,
  share: /^(indian ?%|indian share|ic ?%|ic|local ?%|indigenous ?%|indigenous content)$/i,
};

const num = (s: string | undefined) => {
  if (!s || !/\d/.test(s)) return NaN;
  const n = Number((s ?? "").replace(/[₹,\s]|rs\.?|inr/gi, "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Reads an origin cell: India, IN, imported, a country name, "50%" and so on. */
export function readOrigin(cell: string): { origin: Origin; share?: number } {
  const s = cell.trim().toLowerCase();
  if (!s) return { origin: "UNK" };
  const pct = s.match(/(\d{1,3})\s*%/);
  if (pct) {
    const v = Math.min(100, Number(pct[1]));
    return { origin: v >= 100 ? "IN" : v <= 0 ? "IMP" : "PART", share: v };
  }
  if (/^(in|ind|india|indian|made in india|domestic|local|indigenous|yes)$/.test(s)) return { origin: "IN" };
  if (/(assembled in india|part|partial|mixed)/.test(s)) return { origin: "PART" };
  if (/^(unknown|not known|\?|na|n\/a|-|tbd)$/.test(s)) return { origin: "UNK" };
  return { origin: "IMP" };
}

export function parseIcRows(text: string): IcRow[] {
  const table = parseDelimited(text);
  if (!table.length) return [];
  const head = table[0]!;
  const has = head.some((c) => H.part.test(c) || H.qty.test(c) || H.cost.test(c) || H.origin.test(c));
  const find = (re: RegExp) => head.findIndex((c) => re.test(c));
  const idx = has
    ? { part: Math.max(0, find(H.part)), qty: find(H.qty), cost: find(H.cost), origin: find(H.origin), share: find(H.share) }
    : { part: 0, qty: 1, cost: 2, origin: 3, share: 4 };
  return table
    .slice(has ? 1 : 0)
    .map((r, i) => {
      const part = r[idx.part] ?? "";
      const q = idx.qty >= 0 ? num(r[idx.qty]) : NaN;
      const cost = idx.cost >= 0 ? num(r[idx.cost]) : NaN;
      const o = readOrigin(idx.origin >= 0 ? (r[idx.origin] ?? "") : "");
      const sh = idx.share >= 0 ? num(r[idx.share]) : NaN;
      const share = Number.isFinite(sh) ? Math.max(0, Math.min(100, sh)) : (o.share ?? DEFAULT_SHARE[o.origin]);
      const origin: Origin = Number.isFinite(sh) ? (share >= 100 ? "IN" : share <= 0 ? (o.origin === "UNK" ? "UNK" : "IMP") : "PART") : o.origin;
      return {
        id: i + 1,
        part,
        qty: Number.isFinite(q) && q > 0 ? q : 1,
        unitCost: Number.isFinite(cost) && cost >= 0 ? cost : 0,
        origin,
        share,
        group: groupOf(part),
        replace: false,
      };
    })
    .filter((r) => r.part);
}

/** A Timule part that could replace a row, from the catalogue or built from the numbers in the row. */
export type Replacement = { code: string; name: string; href: string; source: "catalogue" | "configured" };

export function suggestReplacement(row: Pick<IcRow, "part" | "group" | "qty">, catalog: CatalogItem[]): Replacement | null {
  if (!["motor", "esc", "prop"].includes(row.group)) {
    const m = matchRows([{ line: 1, part: row.part, quantity: row.qty, spec: "" }], catalog)[0];
    return m?.item && m.confidence === "strong" ? { code: m.item.code, name: m.item.name, href: `/parts/${m.item.id}`, source: "catalogue" } : null;
  }
  const t = row.part;
  if (row.group === "motor") {
    const size = t.match(/\b(\d{4,5})\b/)?.[1];
    const kv = Number(t.match(/(\d{2,4})\s*kv/i)?.[1]);
    const frame = FRAMES.find((f) => f.size === size);
    if (!frame) return { code: "TM-MOT-…", name: "Motor to your frame and KV", href: "/configure/motor", source: "configured" };
    const best = Number.isFinite(kv) && kv > 0 ? frame.kvs.reduce((a, b) => (Math.abs(b.kv - kv) < Math.abs(a.kv - kv) ? b : a)) : frame.kvs[0]!;
    const useKv = Number.isFinite(kv) && kv > 0 ? kv : best.kv;
    const cells = best.cells.includes("12") ? "12S" : "6S";
    return {
      code: `TM-MOT-${frame.size}-${useKv}-A`,
      name: `${frame.size} ${useKv} KV motor${frame.kvs.some((k) => k.kv === useKv) ? "" : ", custom winding"}`,
      href: `/configure/motor?f=${frame.size}&kv=${useKv}&v=${CELL_VOLTS[cells] ? cells : "6S"}&or=O3&q=${row.qty}`,
      source: "configured",
    };
  }
  if (row.group === "esc") {
    const a = Number(t.match(/(\d{2,3})\s*a\b/i)?.[1]);
    const s = Number(t.match(/(\d{1,2})\s*s\b/i)?.[1]);
    const four = /4.?in.?1|x4/i.test(t);
    const amps = Number.isFinite(a) ? (CONT_AMPS.find((x) => x >= a) ?? CONT_AMPS.at(-1)!) : 45;
    const cells = !Number.isFinite(s) || s <= 6 ? "6" : s <= 12 ? "12" : s <= 14 ? "14" : "24";
    const code = `TM-ESC-${amps}${four ? "X4" : ""}-${cells}S-A`;
    return { code, name: `${four ? "4-in-1 " : ""}${amps} A ESC`, href: `/configure/esc?amps=${amps}&cells=${cells}&layout=${four ? "4" : "1"}&origin=O3&qty=${row.qty}`, source: "configured" };
  }
  const d = Number(t.match(/(\d{1,2}(?:\.\d)?)\s*(?:"|in\b|inch)/i)?.[1] ?? t.match(/\b(\d{1,2})\s*[x×]\s*\d/)?.[1]);
  const dia = Number.isFinite(d) ? DIAMETERS.reduce((x, y) => (Math.abs(y - d) < Math.abs(x - d) ? y : x)) : 24;
  return { code: `TM-PRP-${dia}…`, name: `${dia} in propeller`, href: `/configure/propeller?dia=${dia}&origin=O3&qty=${row.qty}`, source: "configured" };
}

/** Indian share Timule commits to for a replacement: O2 or O3 origin, declared to the material. */
export const TIMULE_SHARE = 90;

export type IcResult = {
  total: number;
  indian: number;
  score: number;
  byGroup: { group: Group; total: number; indian: number }[];
  foreignCritical: IcRow[];
  unknown: IcRow[];
  missingCost: IcRow[];
  whatIf: number;
};

export function computeIc(rows: IcRow[]): IcResult {
  let total = 0;
  let indian = 0;
  let wiIndian = 0;
  const g = new Map<Group, { total: number; indian: number }>();
  for (const r of rows) {
    const cost = r.qty * r.unitCost;
    const ind = (cost * r.share) / 100;
    total += cost;
    indian += ind;
    wiIndian += r.replace ? Math.max(ind, (cost * TIMULE_SHARE) / 100) : ind;
    const cur = g.get(r.group) ?? { total: 0, indian: 0 };
    g.set(r.group, { total: cur.total + cost, indian: cur.indian + ind });
  }
  const pct = (a: number) => (total > 0 ? Math.round((a / total) * 1000) / 10 : 0);
  return {
    total,
    indian,
    score: pct(indian),
    byGroup: [...g.entries()].map(([group, v]) => ({ group, ...v })).sort((a, b) => b.total - a.total),
    foreignCritical: rows.filter((r) => CRITICAL.includes(r.group) && r.share < 50),
    unknown: rows.filter((r) => r.origin === "UNK"),
    missingCost: rows.filter((r) => r.unitCost <= 0),
    whatIf: pct(wiIndian),
  };
}

/** Common targets buyers measure against. Planning figures; the tender or scheme text decides. */
export const TARGETS = [
  { id: "50", pct: 50, label: "50%", note: "Class-I local supplier under the Make in India public procurement order; also the DAP minimum for Buy (Indian-IDDM)" },
  { id: "60", pct: 60, label: "60%", note: "DAP minimum for Buy (Indian) when the design is not Indian" },
  { id: "75", pct: 75, label: "75%", note: "A stretch target that keeps headroom over the 50 and 60 percent rules" },
  { id: "100", pct: 100, label: "No foreign parts", note: "Every critical part Indian: the Army's stated direction" },
];

export const IC_REPORT_KEY = "timule.ic.report";

export const SAMPLE_IC = `part,qty,unit cost,origin,indian %
6215 170KV motor,4,9800,imported,
80A 12S ESC,4,6200,China,
24 inch folding carbon propeller,4,2400,imported,
H7 flight controller,1,18500,imported,
GNSS module dual band,1,7200,imported,
900 MHz telemetry radio,1,14000,imported,
22000mAh 12S Li-ion battery,2,38000,assembled in india,40
Carbon fibre airframe,1,42000,India,
Spray tank and pump,1,16000,India,
Wiring harness and connectors,1,3500,India,
EO camera and gimbal,1,26000,unknown,`;

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
