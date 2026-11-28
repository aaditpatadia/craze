/**
 * Supplier portal: types, the onboarding checklist and labels. Shared by the browser and the
 * server; the functions that read and write the store are in portal-server.ts.
 */

export const SUPPLIER_STATUSES = [
  { id: "invited", label: "Invited", body: "Invited. Sign in with the Google account we invited to start onboarding." },
  { id: "onboarding", label: "Onboarding", body: "Onboarding. Complete your profile, accept the supplier terms and send each item on the checklist." },
  { id: "review", label: "Under review", body: "Everything required is in. The Timule team is reviewing your documents and samples." },
  { id: "approved", label: "Approved supplier", body: "Approved. You can receive purchase orders (TMP) for the TM codes agreed with you." },
  { id: "paused", label: "Paused", body: "Your account is paused. Write to the Timule team to find out why and what is needed." },
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number]["id"];
export const supplierStatusOf = (id: string) => SUPPLIER_STATUSES.find((s) => s.id === id) ?? SUPPLIER_STATUSES[0];

/** Files a supplier can upload: documents, photos and short videos. */
export const VAULT_FILE = {
  types: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime", "video/webm"],
  accept: ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm",
  maxBytes: 50 * 1024 * 1024,
  maxDocBytes: 15 * 1024 * 1024,
  maxFiles: 15,
} as const;

export type PortalFile = { name: string; url: string; size: number; type: string };

export type FieldDef = { id: string; label: string; hint?: string; placeholder?: string; required?: boolean; long?: boolean };

export const SUBMISSION_KINDS = [
  {
    id: "registration",
    label: "Company registration",
    short: "Registration",
    hint: "GST registration certificate, Udyam (MSME) certificate, certificate of incorporation or shop and establishment licence.",
    required: true,
    files: "Upload the certificate as a PDF or a clear photo.",
    minFiles: 1,
    fields: [
      { id: "docType", label: "Document", placeholder: "GST certificate", required: true },
      { id: "number", label: "Registration number", placeholder: "GSTIN, Udyam number or CIN", required: true },
    ],
  },
  {
    id: "certificate",
    label: "Quality certificate",
    short: "Certificates",
    hint: "ISO 9001, AS9100, IATF 16949, ISO 14001, BIS, CE or RoHS declarations, or a test lab's accreditation. One certificate per submission.",
    required: true,
    files: "Upload the certificate, every page.",
    minFiles: 1,
    fields: [
      { id: "standard", label: "Standard", placeholder: "ISO 9001:2015", required: true },
      { id: "issuer", label: "Certification body", placeholder: "TÜV SÜD, BIS, Intertek…", required: true },
      { id: "number", label: "Certificate number" },
      { id: "validUntil", label: "Valid until", placeholder: "2028-03-31" },
    ],
  },
  {
    id: "factory",
    label: "Factory and equipment photos",
    short: "Factory",
    hint: "Your shop floor, assembly or winding line, SMT line, test benches, measuring instruments and stores. Wide shots and close-ups, taken recently.",
    required: true,
    files: "Upload at least 4 photos. A short walk-through video helps.",
    minFiles: 4,
    fields: [
      { id: "address", label: "Factory address", required: true, long: true },
      { id: "equipment", label: "Key machines and test equipment", placeholder: "2 winding machines, dynamometer up to 3 kW, LCR meter, thermal camera", long: true, required: true },
      { id: "staff", label: "People on the shop floor", placeholder: "18" },
    ],
  },
  {
    id: "product",
    label: "Product",
    short: "Products",
    hint: "One part you make or can make to a Timule build sheet: photos from every side, the datasheet, your own part number, capacity and lead time.",
    required: true,
    files: "Upload photos of the part (top, side, underside, connectors, label) and its datasheet.",
    minFiles: 2,
    fields: [
      { id: "partNumber", label: "Your part number", required: true },
      { id: "specs", label: "Key specifications", placeholder: "Stator 28×07 mm, 1300 KV, 6S, 39 g, 12N14P", long: true, required: true },
      { id: "capacity", label: "Monthly capacity, units", placeholder: "2000", required: true },
      { id: "moq", label: "Minimum order, units", placeholder: "100" },
      { id: "leadTime", label: "Lead time", placeholder: "3 weeks from PO" },
      { id: "price", label: "Indicative price, ex-GST", hint: "Confidential. Never shown to buyers.", placeholder: "₹1,450 per unit at 500 units" },
    ],
  },
  {
    id: "test",
    label: "Test proof",
    short: "Test proof",
    hint: "Proof that units are tested: photos or video of parts on the test bench with the readings visible, test reports, batch test records and calibration certificates for the instruments used.",
    required: true,
    files: "Upload photos, videos or reports. Readings must be legible.",
    minFiles: 1,
    fields: [
      { id: "tests", label: "What was tested", placeholder: "KV, no-load current, phase resistance, thrust at 50/75/100 %", long: true, required: true },
      { id: "units", label: "Units tested", placeholder: "20" },
      { id: "batch", label: "Batch number", placeholder: "B2611-04" },
      { id: "instruments", label: "Instruments used", placeholder: "Tyto 1585 thrust stand, Fluke 87V, calibrated 2026-08" },
      { id: "result", label: "Result", placeholder: "All 20 inside the bands; spread ±2.1 % KV" },
    ],
  },
  {
    id: "origin",
    label: "Material origin declaration",
    short: "Origin",
    hint: "Where the key materials and parts come from: magnets, copper wire, bearings, steel laminations, chips, PCBs. 'Unknown' is an acceptable answer. A wrong one is not.",
    required: true,
    files: "Upload supplier invoices, mill certificates or declarations where you have them.",
    minFiles: 0,
    fields: [
      { id: "materials", label: "Material, maker and country, one per line", placeholder: "Magnets N52SH: Ningbo, China\nCopper wire: Hindalco, India\nBearings NMB: Japan", long: true, required: true },
      { id: "localShare", label: "Your estimate of Indian content by value", placeholder: "58 %" },
    ],
  },
  {
    id: "sample",
    label: "Sample shipment",
    short: "Samples",
    hint: "Samples sent to Timule for testing. Each shipment gets a TMX code: write it on the parcel.",
    required: true,
    files: "Upload a photo of the packed samples and the courier receipt.",
    minFiles: 0,
    fields: [
      { id: "items", label: "Parts and quantities, one per line", placeholder: "TM-MOT-2807-1300 × 5\nYour part 2807-1300KV-B × 5", long: true, required: true },
      { id: "courier", label: "Courier", placeholder: "Blue Dart" },
      { id: "tracking", label: "Tracking number" },
      { id: "sentOn", label: "Sent on", placeholder: "2026-12-02" },
    ],
  },
  {
    id: "other",
    label: "Other document",
    short: "Other",
    hint: "Anything else we asked for, or that you think we should see: catalogues, customer references, export licences, insurance.",
    required: false,
    files: "Upload the files.",
    minFiles: 1,
    fields: [{ id: "what", label: "What is it", required: true }],
  },
] as const satisfies readonly { id: string; label: string; short: string; hint: string; required: boolean; files: string; minFiles: number; fields: readonly FieldDef[] }[];

export type SubmissionKind = (typeof SUBMISSION_KINDS)[number]["id"];
export const KIND_IDS = SUBMISSION_KINDS.map((k) => k.id) as SubmissionKind[];
export const kindOf = (id: string) => SUBMISSION_KINDS.find((k) => k.id === id);
/** A kind's form fields, typed loosely so every optional property can be read. */
export const fieldsOf = (id: string): readonly FieldDef[] => (kindOf(id)?.fields ?? []) as readonly FieldDef[];

export const REVIEW_STATES = [
  { id: "submitted", label: "Waiting for review" },
  { id: "accepted", label: "Accepted" },
  { id: "changes", label: "Changes needed" },
  { id: "rejected", label: "Not accepted" },
] as const;
export type ReviewState = (typeof REVIEW_STATES)[number]["id"];
export const reviewLabel = (id: string) => REVIEW_STATES.find((r) => r.id === id)?.label ?? id;

export type PortalSubmission = {
  id: string;
  /** TMD for documents, TMX for sample shipments. */
  ref: string;
  supplierId: string;
  supplierCode: string;
  kind: SubmissionKind;
  title: string;
  /** TM code it relates to, if any. */
  partCode?: string;
  fields: Record<string, string>;
  files: PortalFile[];
  note?: string;
  /** Answers one of the team's requests. */
  requestId?: string;
  status: ReviewState;
  review?: { at: string; by: string; note?: string };
  /** Google email of the supplier, or "team:username". */
  by: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamRequest = { id: string; title: string; detail?: string; due?: string; status: "open" | "done"; createdAt: string; by: string };

export type SupplierProfile = {
  legalName: string;
  tradeName?: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  udyam?: string;
  founded?: string;
  employees?: string;
  website?: string;
  contactName: string;
  contactRole: string;
  phone: string;
  /** What they make, in their words. */
  makes: string;
  capacity?: string;
  customers?: string;
};

export const AGREEMENT_VERSION = "2026-11-28";

export type SupplierAccount = {
  id: string;
  code: string;
  company: string;
  /** Google accounts allowed to sign in, lower case. */
  emails: string[];
  categories: string[];
  status: SupplierStatus;
  /** Onboarding meeting, ISO date-time. */
  meeting?: string;
  /** Team only: never shown to the supplier. */
  notes?: string;
  profile?: SupplierProfile;
  agreement?: { version: string; acceptedAt: string; name: string; title: string; email: string };
  requests: TeamRequest[];
  history: { at: string; by: string; what: string }[];
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
};

export type ChecklistItem = { id: string; label: string; state: "done" | "waiting" | "changes" | "missing"; detail: string };

/** The onboarding checklist and how far along it is. */
export function checklist(s: SupplierAccount, subs: PortalSubmission[]): { items: ChecklistItem[]; done: number; total: number; readyForReview: boolean } {
  const p = s.profile;
  const items: ChecklistItem[] = [
    {
      id: "profile",
      label: "Company profile",
      state: p && p.legalName && p.address && p.phone && p.makes ? "done" : "missing",
      detail: "Legal name, address, contact and what you make.",
    },
    {
      id: "agreement",
      label: "Supplier terms accepted",
      state: s.agreement?.version === AGREEMENT_VERSION ? "done" : "missing",
      detail: s.agreement && s.agreement.version !== AGREEMENT_VERSION ? "The terms were updated. Please read and accept the new version." : "Read and accept the supplier terms.",
    },
    ...SUBMISSION_KINDS.filter((k) => k.required).map((k): ChecklistItem => {
      const mine = subs.filter((x) => x.kind === k.id);
      const state = mine.some((x) => x.status === "accepted")
        ? "done"
        : mine.some((x) => x.status === "submitted")
          ? "waiting"
          : mine.some((x) => x.status === "changes")
            ? "changes"
            : "missing";
      return { id: k.id, label: k.label, state, detail: k.hint };
    }),
  ];
  const done = items.filter((i) => i.state === "done").length;
  const readyForReview = items.every((i) => i.state === "done" || i.state === "waiting");
  return { items, done, total: items.length, readyForReview };
}

export const fileKind = (f: { type: string; name: string }) =>
  f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type === "application/pdf" || /\.pdf$/i.test(f.name) ? "pdf" : "file";

export const fileHref = (url: string) => `/api/files?u=${encodeURIComponent(url)}`;

export const bytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** True when a meeting time has not passed yet, allowing a grace period. */
export const isUpcoming = (iso: string | undefined, graceMs = 0) => !!iso && Date.parse(iso) > Date.now() - graceMs;
