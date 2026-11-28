/**
 * Timule numbering. Zod-free so client components can import it.
 *
 * Every code Timule issues is listed in CODE_DIRECTORY below: the one source for the public
 * /codes page, the team code directory and the PDF register.
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

export type RefPrefix = "TMQ" | "TMR" | "TMO" | "TMP" | "TMI" | "TMC" | "TMA" | "TMD" | "TMX" | "TMV" | "TMB" | "TMF";

export type DirectoryEntry = {
  prefix: string;
  example: string;
  name: string;
  /** Who issues it and when. */
  issued: string;
  /** Who sees it. */
  seen: string;
  group: "Parts" | "Buyers" | "Suppliers" | "Quality" | "Company";
  /** Shown on the public /codes page. Internal-only codes stay on the team directory. */
  public: boolean;
};

/** Every code Timule issues. Each kind of record has its own prefix, so a code alone says what it is. */
export const CODE_DIRECTORY: DirectoryEntry[] = [
  { prefix: "TM-", example: "TM-MOT-6015-150-A", name: "Part code", issued: "By the team, once per part design: category, spec segments, revision letter.", seen: "Everyone: catalogue, labels, quotes, POs and invoices", group: "Parts", public: true },
  { prefix: "TM-", example: "TM-MOT-6015-150.03", name: "Part line", issued: "One internal part on a build sheet, such as a magnet or a bearing.", seen: "Team and the supplier building it", group: "Parts", public: true },
  { prefix: "TMQ", example: "TMQ-261128-7KQ4", name: "Query or sourcing request", issued: "When a buyer sends a request or a BOM.", seen: "Buyer and team", group: "Buyers", public: true },
  { prefix: "TMR", example: "TMR-261128-6XZS", name: "Reservation (letter of intent)", issued: "When a buyer reserves codes with a non-binding letter of intent.", seen: "Buyer and team", group: "Buyers", public: true },
  { prefix: "TMO", example: "TMO-261128-M2XD", name: "Quotation", issued: "When we price a request. It quotes the TMQ or TMR it answers.", seen: "Buyer and team", group: "Buyers", public: true },
  { prefix: "TMI", example: "TMI-261128-Q7NB", name: "Invoice", issued: "When we bill a buyer, quoting their order and the TM codes delivered.", seen: "Buyer and team", group: "Buyers", public: true },
  { prefix: "TMC", example: "TMC-261128-9RTD", name: "Customer complaint", issued: "When a buyer reports a fault, shortage, damage or wrong part.", seen: "Buyer and team. The supplier sees the TMC code, never the buyer", group: "Quality", public: true },
  { prefix: "TMB", example: "TMB-261128-4HZ8", name: "Batch", issued: "When a production batch is tested, if the maker has no batch number of their own.", seen: "Buyer, supplier and team, on the test record", group: "Quality", public: true },
  { prefix: "TMV", example: "TMV-261128-Q7NB", name: "Verification check", issued: "Each document review, sample measurement, lab report or batch test we log.", seen: "Public, on the evidence page", group: "Quality", public: true },
  { prefix: "TMS", example: "TMS-001", name: "Supplier code", issued: "When a maker is invited to the supplier portal. Never reused.", seen: "Everyone. Buyers see the TMS code, never the maker's name", group: "Suppliers", public: true },
  { prefix: "TMA", example: "TMA-261128-M2XD", name: "Supplier application", issued: "When a maker applies through the public form.", seen: "Applicant and team", group: "Suppliers", public: true },
  { prefix: "TMD", example: "TMD-261128-K3PW", name: "Supplier submission", issued: "Each document, photo set, test report or product a supplier submits in the portal.", seen: "That supplier and team", group: "Suppliers", public: true },
  { prefix: "TMX", example: "TMX-261128-H8YC", name: "Sample shipment", issued: "When a supplier records samples sent to us for testing.", seen: "That supplier and team", group: "Suppliers", public: true },
  { prefix: "TMP", example: "TMP-261128-4HZ8", name: "Purchase order", issued: "When we order from a supplier. Printed on their labels, invoice and delivery note.", seen: "That supplier and team", group: "Suppliers", public: true },
  { prefix: "TMF", example: "TMF-261128-2WNA", name: "Investor enquiry", issued: "When an investor writes through the investors page.", seen: "Team", group: "Company", public: false },
];

/** What a typed code is, from its shape and prefix. */
export function identifyCode(raw: string): DirectoryEntry | null {
  const c = raw.trim().toUpperCase();
  if (/^TM-[A-Z]{3}-[A-Z0-9-]+\.\d{2}$/.test(c)) return CODE_DIRECTORY[1]!;
  if (/^TM-[A-Z]{3}-/.test(c)) return CODE_DIRECTORY[0]!;
  return CODE_DIRECTORY.find((e) => e.prefix !== "TM-" && c.startsWith(`${e.prefix}-`)) ?? null;
}

/** Short human-readable reference, for example TMQ-261126-7KQ4. No 0, O, 1, I or L. */
export function makeReference(prefix: RefPrefix, now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${prefix}-${d}-${tail}`;
}
