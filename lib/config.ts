/**
 * Site-wide constants. Everything a non-engineer is likely to change lives here.
 */

export const SITE = {
  /** Verkod: "verified code". Every part we list carries a VK code that buyers order by and suppliers build to. */
  name: "Verkod",
  shortName: "Verkod",
  promise: "One code for every critical part. Buyers order by it, suppliers build to it, and the evidence travels with it.",
  description:
    "Verkod lists the drone, robotics and data center components buyers need most, each with a VK part code, an exploded 3D view, a build sheet for suppliers and the evidence behind every claim.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en-GB",
  /** Prefix on every part code. */
  codePrefix: "VK",
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
  { href: "/sectors", label: "Sectors" },
  { href: "/codes", label: "VK codes" },
  { href: "/bom", label: "BOM checker" },
  { href: "/suppliers/join", label: "For suppliers" },
  { href: "/methodology", label: "Methodology" },
] as const;
