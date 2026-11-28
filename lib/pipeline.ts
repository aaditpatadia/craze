/**
 * Cases (sourcing requests and letters of intent), the verification log, and the numbers built
 * from them. Types and labels are shared with the browser; the functions that read the store
 * are server only.
 */

export const STATUSES = [
  { id: "received", label: "Received", body: "We have your request and will reply within one working day." },
  { id: "reviewing", label: "Reviewing", body: "We are matching each line to a TM code and a qualified maker." },
  { id: "quoted", label: "Quoted", body: "A quotation has been sent to you." },
  { id: "loi", label: "Letter of intent", body: "Your letter of intent is confirmed. We plan maker capacity against it." },
  { id: "ordered", label: "Ordered", body: "Purchase order received. Production is being scheduled." },
  { id: "production", label: "In production", body: "The maker is building your batch to the TM code's build sheet." },
  { id: "tested", label: "Batch tested", body: "Your batch has been tested against the acceptance bands. Only passing parts are released." },
  { id: "dispatched", label: "Dispatched", body: "Your parts are on the way, with the batch test record and origin dossier." },
  { id: "delivered", label: "Delivered", body: "Delivered. The evidence pack is filed under each TM code." },
  { id: "closed", label: "Closed", body: "This request is closed." },
] as const;
export type StatusId = (typeof STATUSES)[number]["id"];
export const STATUS_IDS = STATUSES.map((s) => s.id) as StatusId[];
export const statusOf = (id: string) => STATUSES.find((s) => s.id === id) ?? STATUSES[0];

export type CaseItem = { code: string; qty: number };

export type Case = {
  /** Secret id. Also the tracking link, so never shown anywhere public. */
  id: string;
  ref: string;
  kind: "request" | "loi";
  createdAt: string;
  updatedAt: string;
  status: StatusId;
  /** What was asked for, as the buyer wrote it. */
  summary: string;
  items: CaseItem[];
  timeline: string;
  sector?: string;
  targetPrice?: string;
  /** Private: shown only on the founder desk. */
  contact: { company: string; name?: string; email: string; role?: string; phone?: string };
  history: { at: string; status: StatusId; note?: string }[];
};

export const CHECK_KINDS = [
  { id: "documents", label: "Documents reviewed", tier: 1 },
  { id: "sample", label: "Sample measured", tier: 2 },
  { id: "lab", label: "Lab report filed", tier: 3 },
  { id: "batch", label: "Batch tested", tier: 2 },
] as const;
export type CheckKind = (typeof CHECK_KINDS)[number]["id"];
export const checkLabel = (k: string) => CHECK_KINDS.find((c) => c.id === k)?.label ?? k;

export type Check = {
  id: string;
  createdAt: string;
  /** Date the check was done, YYYY-MM-DD. */
  date: string;
  code: string;
  kind: CheckKind;
  /** TMS supplier code, never a maker's name. */
  supplier?: string;
  batch?: string;
  units?: number;
  result: "pass" | "fail" | "info";
  /** One measurement or finding per line, e.g. "KV: 1296 rpm/V (band 1235–1365)". */
  lines: string[];
  notes?: string;
  /** Who checked: founder initials. */
  by: string;
};

/** TM codes mentioned anywhere in free text. */
export function codesIn(s: string): string[] {
  return [...new Set((s.toUpperCase().match(/\bTM-[A-Z]{3}(?:-[A-Z0-9]+)+/g) ?? []).map((c) => c.replace(/-A$/, "")))];
}
