/**
 * Form validation shared by the browser and the API routes. Plain TypeScript, so the
 * client bundle stays small; the server runs exactly the same rules.
 */

export const TIMELINES = ["Within 2 weeks", "Within 1 month", "1 to 3 months", "More than 3 months", "Exploring options"] as const;

export type RequestInput = {
  company: string;
  email: string;
  role: string;
  parts: string;
  quantity: string;
  timeline: string;
  message: string;
  /** Honeypot. Real people never see or fill it. */
  website: string;
  /** Milliseconds since epoch when the form was first shown. */
  startedAt: number;
};

export type NotifyInput = { email: string; category: string; website: string; startedAt: number };

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRequest(v: RequestInput): FieldErrors<RequestInput> {
  const e: FieldErrors<RequestInput> = {};
  if (v.company.trim().length < 2) e.company = "Enter your company name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address, like name@company.com.";
  if (v.role.trim().length < 2) e.role = "Enter your role, for example procurement lead.";
  if (v.parts.trim().length < 3) e.parts = "Tell us which parts you need.";
  if (!/^\s*\d[\d,\s]*\s*$/.test(v.quantity) || Number(v.quantity.replace(/[^\d]/g, "")) < 1) e.quantity = "Enter a quantity, for example 200.";
  if (!(TIMELINES as readonly string[]).includes(v.timeline)) e.timeline = "Choose a timeline.";
  if (v.message.length > 4000) e.message = "Keep this under 4,000 characters.";
  if (v.parts.length > 8000) e.parts = "Keep this under 8,000 characters, or send the full BOM through the checker.";
  return e;
}

export function validateNotify(v: NotifyInput): FieldErrors<NotifyInput> {
  const e: FieldErrors<NotifyInput> = {};
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address.";
  if (!v.category) e.category = "Missing category.";
  return e;
}

export type InvestorInput = { name: string; email: string; firm: string; interest: string; message: string; website: string; startedAt: number };

export function validateInvestor(v: InvestorInput): FieldErrors<InvestorInput> {
  const e: FieldErrors<InvestorInput> = {};
  if (v.name.trim().length < 2) e.name = "Enter your name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address.";
  if (v.firm.trim().length < 2) e.firm = "Enter your firm, or 'Angel'.";
  if (v.message.length > 3000) e.message = "Keep this under 3,000 characters.";
  return e;
}

/** Bots fill hidden fields and submit within moments of page load. */
export function looksLikeSpam(v: { website: string; startedAt: number }, now = Date.now()) {
  return v.website.trim() !== "" || !Number.isFinite(v.startedAt) || now - v.startedAt < 2500;
}

export const ORIGIN_KNOWLEDGE = [
  "Yes, documented for every material",
  "Partly: we know some sub-suppliers",
  "No, not yet",
] as const;

/** Certifications a supplier can tick. At least one is required to apply. */
export const CERTIFICATIONS = [
  "ISO 9001",
  "AS9100",
  "IATF 16949",
  "ISO 14001",
  "ISO 45001",
  "ISO 13485",
  "IPC-A-610 / J-STD-001",
  "BIS",
  "CE / RoHS",
  "Udyam (MSME) registration",
  "Other",
] as const;

/** Certificate uploads: PDF or image, up to 10 MB each, up to 6 files. */
export const CERT_FILE = {
  types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  accept: ".pdf,.jpg,.jpeg,.png,.webp",
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 6,
} as const;

export type UploadedFile = { name: string; url: string };

export type SupplierInput = {
  company: string;
  email: string;
  city: string;
  role: string;
  /** Category ids the maker builds, from the catalogue list. */
  categories: string[];
  /** Company website or online catalogue, if it lists their products. */
  siteUrl: string;
  /** Optional: TM codes or specific parts. */
  parts: string;
  capacity: string;
  origin: string;
  /** Ticked certifications. At least one. */
  certifications: string[];
  /** Names of any certification not in the list. */
  certificationsOther: string;
  /** Certificates uploaded to our storage. */
  certificateFiles: UploadedFile[];
  /** Or a shared link (Drive, Dropbox, website) to the certificates. */
  certificateLink: string;
  message: string;
  website: string;
  startedAt: number;
};

const URL_RE = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;
const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\//i;

export function validateSupplier(v: SupplierInput): FieldErrors<SupplierInput> {
  const e: FieldErrors<SupplierInput> = {};
  if (v.company.trim().length < 2) e.company = "Enter your company name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address, like name@company.com.";
  if (v.city.trim().length < 2) e.city = "Enter the city where the parts are made.";
  if (v.role.trim().length < 2) e.role = "Enter your role.";
  const site = v.siteUrl.trim();
  if (site && !URL_RE.test(site)) e.siteUrl = "Enter a web address, like yourcompany.in/products.";
  if (v.categories.length === 0 && !site) e.categories = "Tick the kinds of part you make, or give the web page that lists them.";
  if (v.capacity.trim().length < 1) e.capacity = "Give a rough monthly capacity, for example 2,000 units.";
  if (!(ORIGIN_KNOWLEDGE as readonly string[]).includes(v.origin)) e.origin = "Choose one.";
  if (v.certifications.length === 0) e.certifications = "Tick at least one certification or registration you hold.";
  else if (v.certifications.some((c) => !(CERTIFICATIONS as readonly string[]).includes(c))) e.certifications = "Choose from the list.";
  else if (v.certifications.includes("Other") && v.certificationsOther.trim().length < 2) e.certificationsOther = "Name the other certification.";
  const link = v.certificateLink.trim();
  if (link && !URL_RE.test(link)) e.certificateLink = "Enter a link, like drive.google.com/...";
  if (v.certificateFiles.length > CERT_FILE.maxFiles) e.certificateFiles = `Upload up to ${CERT_FILE.maxFiles} files.`;
  else if (v.certificateFiles.some((f) => !BLOB_HOST.test(f.url))) e.certificateFiles = "Upload the certificates again.";
  else if (v.certificateFiles.length === 0 && !link) e.certificateFiles = "Upload your certificates, or paste a link to them.";
  if (v.parts.length > 4000) e.parts = "Keep this under 4,000 characters.";
  if (v.message.length > 4000) e.message = "Keep this under 4,000 characters.";
  if (v.certificationsOther.length > 300) e.certificationsOther = "Keep this under 300 characters.";
  return e;
}

export const SECTORS = ["Drones", "Robotics", "Data centers", "Other"] as const;

export type ReserveInput = {
  items: string;
  timeline: string;
  targetPrice: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  sector: string;
  notes: string;
  agree: boolean;
  website: string;
  startedAt: number;
};

/** "TM-MOT-2807-1300 x 200" lines into codes and quantities. */
export function parseReserveItems(s: string): { code: string; qty: number }[] {
  return s
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const code = (l.toUpperCase().match(/TM-[A-Z]{3}(?:-[A-Z0-9]+)+/)?.[0] ?? "").replace(/-A$/, "");
      const rest = l.toUpperCase().replace(/TM-[A-Z]{3}(?:-[A-Z0-9]+)+/, "");
      const qty = Number(rest.match(/\d[\d,]*/)?.[0]?.replace(/,/g, "") ?? 0);
      return { code, qty };
    })
    .filter((i) => i.code);
}

export function validateReserve(v: ReserveInput): FieldErrors<ReserveInput> {
  const e: FieldErrors<ReserveInput> = {};
  const items = parseReserveItems(v.items);
  if (!items.length) e.items = "Add at least one TM code with a quantity, like TM-MOT-2807-1300 x 200.";
  else if (items.some((i) => i.qty < 1)) e.items = "Give a quantity for every code, like TM-MOT-2807-1300 x 200.";
  else if (items.length > 30) e.items = "Up to 30 codes per letter.";
  if (!(TIMELINES as readonly string[]).includes(v.timeline)) e.timeline = "Choose a timeline.";
  if (v.company.trim().length < 2) e.company = "Enter your company name.";
  if (v.name.trim().length < 2) e.name = "Enter your name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address.";
  if (!(SECTORS as readonly string[]).includes(v.sector)) e.sector = "Choose a sector.";
  if (!v.agree) e.agree = "Confirm that this is a non-binding letter of intent.";
  if (v.notes.length > 3000) e.notes = "Keep this under 3,000 characters.";
  return e;
}
