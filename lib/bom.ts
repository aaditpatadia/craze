/**
 * Bill-of-materials parsing and matching. Runs entirely in the browser for v1:
 * nothing the user uploads leaves the page unless they send a request.
 */
import type { CatalogItem } from "./content";
import { TIER_LABEL, originLabel } from "./format";

export type BomRow = { line: number; part: string; quantity: number | null; spec: string };

export type BomMatch = {
  row: BomRow;
  item: CatalogItem | null;
  confidence: "strong" | "possible" | null;
  score: number;
};

/** RFC 4180-style CSV parsing with quoted fields; also handles tab and semicolon. */
export function parseDelimited(text: string): string[][] {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const delim = firstLine.includes("\t") ? "\t" : (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c));
}

const HEADER = {
  part: /^(part|item|description|name|component|part name|part number|mpn)$/i,
  quantity: /^(qty|quantity|count|units|q'?ty)$/i,
  spec: /^(spec|specs|specification|notes|requirements|details)$/i,
};

export function toBomRows(table: string[][]): BomRow[] {
  if (table.length === 0) return [];
  const head = table[0]!;
  const hasHeader = head.some((c) => HEADER.part.test(c) || HEADER.quantity.test(c));
  const idx = hasHeader
    ? {
        part: Math.max(0, head.findIndex((c) => HEADER.part.test(c))),
        quantity: head.findIndex((c) => HEADER.quantity.test(c)),
        spec: head.findIndex((c) => HEADER.spec.test(c)),
      }
    : { part: 0, quantity: 1, spec: 2 };
  return table
    .slice(hasHeader ? 1 : 0)
    .map((r, i) => {
      const q = idx.quantity >= 0 ? Number((r[idx.quantity] ?? "").replace(/[^\d.]/g, "")) : NaN;
      return {
        line: i + (hasHeader ? 2 : 1),
        part: r[idx.part] ?? "",
        quantity: Number.isFinite(q) && q > 0 ? q : null,
        spec: idx.spec >= 0 ? (r[idx.spec] ?? "") : r.slice(2).join(" "),
      };
    })
    .filter((r) => r.part);
}

const STOP = new Set(["the", "a", "an", "and", "or", "for", "with", "of", "to", "in", "x", "pcs", "pc", "piece", "pieces", "unit", "units"]);
const SYNONYMS: Record<string, string[]> = {
  motor: ["bldc", "brushless", "outrunner"],
  motors: ["bldc", "brushless", "outrunner"],
  prop: ["propeller"],
  props: ["propeller"],
  propellers: ["propeller"],
  fc: ["flight", "controller"],
  autopilot: ["flight", "controller"],
  esc: ["esc", "speed", "controller"],
  escs: ["esc"],
  airframe: ["frame"],
};

export function tokens(s: string): string[] {
  const base = s
    .toLowerCase()
    .replace(/(\d)\s+(kv|a|s|mm|in|inch|g)\b/g, "$1$2")
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t && !STOP.has(t));
  return base.flatMap((t) => [t, ...(SYNONYMS[t] ?? [])]);
}

// Codes like 2807, 1300kv or 45a identify a part. Cell counts (6s) and bare small numbers do not.
const isCode = (t: string) => /\d/.test(t) && !/^\d{1,2}s$/.test(t) && !/^\d{1,2}$/.test(t);

function itemTokens(item: CatalogItem): Set<string> {
  const specBits = item.specs.flatMap((s) => {
    if (typeof s.value !== "number" || !s.unit) return [String(s.value)];
    const unit = s.unit.toLowerCase().replace("rpm/v", "kv");
    return [`${s.value}${unit}`, String(s.value)];
  });
  return new Set(tokens([item.name, item.categoryName, ...item.keywords, ...specBits].join(" ")));
}

const normCode = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Exact hits on a VK code (with or without the revision letter) or a supplier's own part number. */
function exactMatch(row: BomRow, catalog: CatalogItem[]): CatalogItem | undefined {
  const cells = [row.part, row.spec].map(normCode).filter((c) => c.length >= 5);
  if (!cells.length) return undefined;
  return catalog.find((item) => {
    const keys = [item.code, item.code.replace(/-[A-Z]$/, ""), ...item.aliases].map(normCode);
    return cells.some((c) => keys.includes(c));
  });
}

export function matchRows(rows: BomRow[], catalog: CatalogItem[]): BomMatch[] {
  const indexed = catalog.map((item) => ({ item, toks: itemTokens(item) }));
  return rows.map((row) => {
    const exact = exactMatch(row, catalog);
    if (exact) return { row, item: exact, confidence: "strong" as const, score: 100 };
    const rt = [...new Set(tokens(`${row.part} ${row.spec}`))];
    let best: { item: CatalogItem; score: number; codes: number; words: number } | null = null;
    for (const { item, toks } of indexed) {
      let score = 0;
      let codes = 0;
      let words = 0;
      for (const t of rt) {
        if (!toks.has(t)) continue;
        if (isCode(t)) {
          score += 3;
          codes++;
        } else {
          score += 1;
          words++;
        }
      }
      if (!best || score > best.score) best = { item, score, codes, words };
    }
    const total = rt.reduce((n, t) => n + (isCode(t) ? 3 : 1), 0) || 1;
    const ratio = best ? best.score / total : 0;
    let confidence: BomMatch["confidence"] = null;
    if (best && best.codes >= 1 && ratio >= 0.45) confidence = "strong";
    else if (best && (best.codes >= 1 || best.words >= 2) && ratio >= 0.25) confidence = "possible";
    return { row, item: confidence ? best!.item : null, confidence, score: Math.round(ratio * 100) };
  });
}

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function matchesToCsv(matches: BomMatch[], siteUrl: string): string {
  const head = ["Line", "Your part", "Quantity", "Your spec", "Status", "VK code", "Matched part", "Supplier", "Origin", "Highest evidence", "Link"];
  const lines = matches.map((m) =>
    [
      m.row.line,
      m.row.part,
      m.row.quantity,
      m.row.spec,
      m.item ? (m.confidence === "strong" ? "Strong match" : "Possible match, please confirm") : "No match yet",
      m.item?.code ?? "",
      m.item?.name ?? "",
      m.item?.supplierName ?? "",
      m.item ? originLabel(m.item.originCountry) : "",
      m.item ? `Tier ${m.item.highestTier}: ${TIER_LABEL[m.item.highestTier]}` : "",
      m.item ? `${siteUrl}/parts/${m.item.id}` : "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\r\n");
}

export const SAMPLE_BOM = `part,quantity,spec
2807 1300KV motor,8,6S 7 inch
45A ESC,8,DShot600
H7 flight controller,2,dual IMU
15 inch folding carbon propeller,16,15x5
650mm quad frame,2,folding arms
5000mAh 6S LiPo battery,4,
GNSS module,2,dual band
VK-FAN-8056-12,40,
HM-4114-400,8,`;
