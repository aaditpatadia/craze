/**
 * Site-wide constants. Everything a non-engineer is likely to change lives here.
 */

export const SITE = {
  /** Timule. Every part we list carries a TM code that buyers order by and suppliers build to. */
  name: "Timule",
  shortName: "Timule",
  promise: "One code for every critical part. Buyers order by it, suppliers build to it, and the evidence travels with it.",
  description:
    "Timule supplies Indian-made critical components for drones, robots and data centers: BLDC motors, ESCs, flight controllers, robot joint actuators, AGV drive wheels, server fans, server power supplies and liquid cooling. One TM part code, one invoice, proof of origin and checks on every batch.",
  /** timule.com on Vercel (production and previews, so links in shared documents always work), localhost in development. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NEXT_PUBLIC_VERCEL_ENV ? "https://timule.com" : "http://localhost:3000"),
  locale: "en-GB",
  /** Prefix on every part code. */
  codePrefix: "TM",
  /** Where people can write to us. Shown in the footer and next to every form. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hellotimule@gmail.com",
  /** Formspree form that emails every submission to contactEmail. */
  formEndpoint: process.env.FORMSPREE_ENDPOINT ?? "https://formspree.io/f/xqpqoqgn",
} as const;

/**
 * The business behind the site, printed on every document. Fill these in as registrations come through.
 * While gstin is null, invoices print as proforma invoices: a tax invoice needs a GSTIN.
 */
export const COMPANY = {
  tradeName: "Timule",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "Timule",
  /** Registered address lines. Empty until the company is registered. */
  address: [] as string[],
  /** State of registration, for GST place of supply. */
  state: process.env.NEXT_PUBLIC_COMPANY_STATE ?? "",
  gstin: process.env.NEXT_PUBLIC_GSTIN ?? null,
  pan: process.env.NEXT_PUBLIC_PAN ?? null,
  dpiit: process.env.NEXT_PUBLIC_DPIIT ?? null,
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? null,
  /** Bank account for payment. Null prints "Bank details sent separately". */
  bank: null as null | { name: string; account: string; ifsc: string; branch: string },
} as const;

/**
 * When true, records marked `placeholder: true` in /content are shown with a "Sample data" tag.
 * When false, sample suppliers are removed and sample parts keep only what Timule defines:
 * code, target specs, parts, build sheet and model. No fictional evidence or origin is shown.
 */
export const USE_PLACEHOLDER_DATA = false;

/** Evidence and supplier records older than this are marked stale. */
export const STALE_AFTER_MONTHS = 12;


export const NAV = [
  { href: "/parts", label: "Parts" },
  { href: "/configure", label: "Configure" },
  { href: "/tools", label: "Tools" },
  { href: "/sectors", label: "Sectors" },
  { href: "/codes", label: "TM codes" },
  { href: "/bom", label: "BOM checker" },
  { href: "/methodology", label: "Methodology" },
] as const;
