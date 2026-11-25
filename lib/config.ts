/**
 * Site-wide constants. Everything a non-engineer is likely to change lives here.
 */

export const SITE = {
  /** Placeholder brand name. Replace before launch. */
  name: "Assay Components",
  shortName: "Assay",
  promise: "Drone parts you can inspect before you buy, with the evidence behind every claim.",
  description:
    "A catalogue of drone propulsion and structure parts. Inspect each part in 3D, see what every internal component does, where it comes from, and exactly what evidence backs each claim.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-GB",
} as const;

/**
 * When true, records marked `placeholder: true` in /content are shown, each with a
 * visible "Sample data" tag. When false, placeholder records are removed from every
 * page, so sample data can never appear untagged.
 */
export const USE_PLACEHOLDER_DATA = true;

/** Evidence and supplier records older than this are marked stale. */
export const STALE_AFTER_MONTHS = 12;

/** Personal mail providers. The request form asks for a company address. */
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "rediffmail.com",
  "qq.com",
  "163.com",
];

export const NAV = [
  { href: "/parts", label: "Parts" },
  { href: "/bom", label: "BOM checker" },
  { href: "/methodology", label: "Methodology" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/about", label: "About" },
] as const;
