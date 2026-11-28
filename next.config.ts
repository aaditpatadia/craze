import type { NextConfig } from "next";
import type { Redirect } from "next/dist/lib/load-custom-routes";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy: which sources the browser may load. Scripts only from this site (and
 * Plausible analytics); no plugins; no framing by other sites; forms post only to this site.
 * 'unsafe-inline' is needed for Next.js's inline bootstrap scripts and the theme script;
 * 'wasm-unsafe-eval' lets the 3D viewer decode compressed models. Uploads go to Vercel Blob.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://plausible.io`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io https://vercel.com https://*.vercel-storage.com" + (isDev ? " ws: http://localhost:*" : ""),
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS only, for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

/** Founder pages, sign-in and the API are never cached by browsers or shared caches. */
const noStore = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];

/** Part ids before the move to Timule codes (first the maker ids, then the VK ids). Old links keep working. */
const RENAMED_PARTS: Record<string, string> = {
  "hm-2807-1300kv": "tm-mot-2807-1300",
  "hm-4114-400kv": "tm-mot-4114-400",
  "la-esc-45a": "tm-esc-45-6s",
  "la-esc-80a-hv": "tm-esc-80-14s",
  "la-fc-h7": "tm-fct-h7-30",
  "sw-cf1550-fold": "tm-prp-1550-f2",
  "sw-5143-tri": "tm-prp-5143-3",
  "qc-x650-frame": "tm-frm-650-x4",
  "vk-act-80-100": "tm-act-80-100",
  "vk-cpl-g1-skv": "tm-cpl-g1-skv",
  "vk-esc-45-6s": "tm-esc-45-6s",
  "vk-esc-80-14s": "tm-esc-80-14s",
  "vk-fan-8056-12": "tm-fan-8056-12",
  "vk-fct-h7-30": "tm-fct-h7-30",
  "vk-frm-650-x4": "tm-frm-650-x4",
  "vk-gns-l1l5-m": "tm-gns-l1l5-m",
  "vk-mot-2807-1300": "tm-mot-2807-1300",
  "vk-mot-4114-400": "tm-mot-4114-400",
  "vk-mot-6215-170": "tm-mot-6215-170",
  "vk-prp-1550-f2": "tm-prp-1550-f2",
  "vk-prp-5143-3": "tm-prp-5143-3",
  "vk-psu-2400-crps": "tm-psu-2400-crps",
  "vk-whl-150-48": "tm-whl-150-48",
};

const SUPPLIER_IDS: Record<string, string> = {
  "harrow-motion": "tms-001",
  "lintel-avionics": "tms-002",
  "sablewood-rotors": "tms-003",
  "quarry-composites": "tms-004",
  "tarnfield-drives": "tms-005",
  "corran-thermal": "tms-006",
  "ostra-power": "tms-007",
};

const nextConfig: NextConfig = {
  async redirects(): Promise<Redirect[]> {
    return [
      ...Object.entries(RENAMED_PARTS).map(([from, to]) => ({ source: `/parts/${from}`, destination: `/parts/${to}`, permanent: true })),
      ...Object.entries(RENAMED_PARTS)
        .filter(([from]) => from.startsWith("vk-"))
        .map(([from, to]) => ({ source: `/sheets/${from}`, destination: `/sheets/${to}`, permanent: true })),
      ...Object.entries(SUPPLIER_IDS).map(([from, to]) => ({ source: `/suppliers/${from}`, destination: `/suppliers/${to}`, permanent: true })),
      // The site moved from the Vercel address to timule.com: old links land on the same page there.
      { source: "/:path*", has: [{ type: "host", value: "craze-five.vercel.app" }], destination: "https://timule.com/:path*", permanent: true },
    ];
  },
  reactStrictMode: true,
  poweredByHeader: false,
  // No source maps in the browser in production: our code stays ours.
  productionBrowserSourceMaps: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: noStore },
      { source: "/(admin|desk|login|team|supplier)", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/(desk|track|team|supplier)/:path*", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      {
        source: "/assets/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/draco/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
