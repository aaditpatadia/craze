/**
 * Quotations, purchase orders and invoices made on the Timule desk.
 * Pure functions, safe in client components. Nothing is stored on a server:
 * a document lives in its own link (the #d= part of the URL) and in this browser.
 */
import { COMPANY } from "./config";

export type DocKind = "quotation" | "purchase-order" | "invoice";

export const DOC_KIND: Record<DocKind, { label: string; prefix: "TMQ" | "TMP" | "TMI"; party: string; due: string }> = {
  quotation: { label: "Quotation", prefix: "TMQ", party: "Quoted to", due: "Valid until" },
  "purchase-order": { label: "Purchase order", prefix: "TMP", party: "Supplier", due: "Deliver by" },
  invoice: { label: "Invoice", prefix: "TMI", party: "Bill to", due: "Payment due" },
};

export type Party = { name: string; address: string; gstin: string; state: string; contact: string };
export type DocLine = { code: string; description: string; hsn: string; qty: number; unit: string; rate: number; gst: number };
export type DocDraft = {
  kind: DocKind;
  number: string;
  date: string;
  due: string;
  /** Their PO number, our TMQ reference, or the buyer order this PO serves. */
  reference: string;
  party: Party;
  /** TMS code when the party is a supplier. */
  supplierCode: string;
  shipTo: string;
  lines: DocLine[];
  terms: string;
  notes: string;
};

/** Suggested HSN codes by category code. A starting point only: confirm each with your accountant. */
export const HSN_SUGGEST: Record<string, string> = {
  MOT: "850131",
  ESC: "850440",
  FCT: "880730",
  GNS: "852691",
  PRP: "880710",
  FRM: "880730",
  ACT: "850131",
  WHL: "850131",
  FAN: "841459",
  PSU: "850440",
  CPL: "841950",
  BAT: "850760",
};

export const DEFAULT_TERMS: Record<DocKind, string> = {
  quotation: [
    "Prices are in Indian rupees per unit, before GST unless shown otherwise.",
    "Valid until the date above.",
    "Payment: 50 percent with the order, balance before dispatch.",
    "Every unit is supplied to the Timule build sheet for its TM code and revision, and marked with that code.",
    "Lead time runs from receipt of the advance. Freight and insurance are extra unless shown as a line.",
  ].join("\n"),
  "purchase-order": [
    "Build each line to the Timule build sheet for its TM code and revision, as it stood on the date of this order.",
    "Mark every unit and carton with the TM code, batch number and this order number.",
    "Send the documents the build sheet lists with the shipment. Delivery is not complete without them.",
    "We inspect against the acceptance bands on the build sheet. Rejected units are replaced at your cost.",
    "Quote this order number on your invoice and delivery note.",
    "Parts made to Timule codes are sold to buyers introduced by Timule only through Timule, for 24 months from this order.",
  ].join("\n"),
  invoice: [
    "Payment is due by the date above. Quote the invoice number with your payment.",
    "Report shortages or transit damage within 7 days of delivery.",
    "Goods remain the property of Timule until paid in full.",
  ].join("\n"),
};

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function emptyDraft(kind: DocKind, number: string): DocDraft {
  const date = today();
  return {
    kind,
    number,
    date,
    due: plusDays(date, kind === "invoice" ? 15 : kind === "quotation" ? 30 : 21),
    reference: "",
    party: { name: "", address: "", gstin: "", state: "", contact: "" },
    supplierCode: "",
    shipTo: "",
    lines: [],
    terms: DEFAULT_TERMS[kind],
    notes: "",
  };
}

export type Totals = {
  subtotal: number;
  mode: "intra" | "inter" | "unknown";
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  roundOff: number;
  total: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const norm = (s: string) => s.trim().toLowerCase();

export function lineAmount(l: DocLine) {
  return round2((Number(l.qty) || 0) * (Number(l.rate) || 0));
}

export function computeTotals(d: DocDraft): Totals {
  const subtotal = round2(d.lines.reduce((s, l) => s + lineAmount(l), 0));
  const tax = round2(d.lines.reduce((s, l) => s + (lineAmount(l) * (Number(l.gst) || 0)) / 100, 0));
  const ours = norm(COMPANY.state);
  const theirs = norm(d.party.state);
  const mode = !ours || !theirs ? "unknown" : ours === theirs ? "intra" : "inter";
  const half = round2(tax / 2);
  const exact = subtotal + tax;
  const total = Math.round(exact);
  return {
    subtotal,
    mode,
    cgst: mode === "intra" ? half : 0,
    sgst: mode === "intra" ? round2(tax - half) : 0,
    igst: mode === "inter" ? tax : 0,
    tax,
    roundOff: round2(total - exact),
    total,
  };
}

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n: number) => inr.format(n);

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const rest = r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? ` ${ONES[r % 10]}` : ""}`;
  return [h ? `${ONES[h]} hundred` : "", rest].filter(Boolean).join(" ");
}

/** Whole rupees in words, Indian system: 1,25,000 is "one lakh twenty five thousand". */
export function rupeesInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "Rupees zero only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${crore >= 1000 ? rupeesInWords(crore).replace(/^Rupees | only$/g, "") : below1000(crore)} crore`);
  if (lakh) parts.push(`${below1000(lakh)} lakh`);
  if (thousand) parts.push(`${below1000(thousand)} thousand`);
  if (n) parts.push(below1000(n));
  const words = parts.join(" ");
  return `Rupees ${words} only`;
}

/** UTF-8 safe base64url, so a whole document fits in a shareable link. */
export function encodeDraft(d: DocDraft): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDraft(s: string): DocDraft | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(bytes)) as DocDraft;
    if (!d || !(d.kind in DOC_KIND) || !Array.isArray(d.lines)) return null;
    return d;
  } catch {
    return null;
  }
}

export function docTitle(d: DocDraft): string {
  if (d.kind === "invoice") return COMPANY.gstin ? "Tax invoice" : "Proforma invoice";
  return DOC_KIND[d.kind].label;
}
