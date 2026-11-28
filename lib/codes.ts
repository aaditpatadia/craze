/**
 * Timule numbering. Zod-free so client components can import it.
 *
 *   TM-MOT-2807-1300-A     part code: prefix, category, spec segments, revision
 *   TMS-001                supplier code
 *   TMQ-261126-7KQ4        quote or sourcing request reference
 *   TMA-261126-M2XD        supplier application reference
 *   TMP-261126-4HZ8        purchase order we send to a supplier
 *   TMI-261126-Q7NB        invoice we send to a buyer
 */

export type CodeCategory = { code: string; id: string; name: string; sector: string };

export type DecodedCode =
  | { ok: false; reason: string }
  | {
      ok: true;
      code: string;
      prefix: string;
      category: CodeCategory | null;
      categoryCode: string;
      specs: string[];
      revision: string;
    };

export const SPEC_HINTS: Record<string, string> = {
  MOT: "Stator diameter and height in mm, then KV",
  ESC: "Continuous current in A, then rated cells",
  FCT: "Processor family, then mounting pattern in mm",
  GNS: "Bands tracked, then M for an integrated compass",
  PRP: "Diameter and pitch, then blade count or F2 for a folding two-blade",
  FRM: "Wheelbase in mm, then layout and arm count",
  ACT: "Housing diameter in mm, then gear ratio",
  WHL: "Wheel diameter in mm, then rated voltage",
  FAN: "Frame width and depth in mm, then rated voltage",
  PSU: "Rated power in W, then form factor",
  CPL: "Generation, then fin type: SKV for skived copper",
};

/** Normalises what people type: lower case, spaces, missing hyphens after TM. */
export function normaliseCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/^TM(?=[A-Z]{3})/, "TM-")
    .replace(/-+/g, "-");
}

export function decodeCode(raw: string, categories: CodeCategory[]): DecodedCode {
  const code = normaliseCode(raw);
  if (!code) return { ok: false, reason: "Type a code to decode it." };
  const parts = code.split("-");
  if (parts[0] !== "TM") return { ok: false, reason: "Timule part codes start with TM." };
  if (!parts[1] || !/^[A-Z]{3}$/.test(parts[1])) return { ok: false, reason: "After TM comes a three letter category code, for example MOT." };
  const category = categories.find((c) => c.code === parts[1]) ?? null;
  const rest = parts.slice(2);
  if (rest.length === 0) return { ok: false, reason: "The code needs spec segments after the category, for example 2807-1300." };
  const last = rest[rest.length - 1]!;
  const hasRevision = rest.length >= 2 && /^[A-Z]$/.test(last);
  return {
    ok: true,
    code: hasRevision ? code : `${code}-A`,
    prefix: "TM",
    category,
    categoryCode: parts[1],
    specs: hasRevision ? rest.slice(0, -1) : rest,
    revision: hasRevision ? last : "A",
  };
}

/** Code without its revision letter, as used in URLs. */
export const codeToId = (code: string) => code.toLowerCase().replace(/-[a-z]$/, "");

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Short human-readable reference, for example TMQ-261126-7KQ4. No 0, O, 1, I or L. */
export function makeReference(prefix: "TMQ" | "TMA" | "TMP" | "TMI" | "TMR", now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${prefix}-${d}-${tail}`;
}
