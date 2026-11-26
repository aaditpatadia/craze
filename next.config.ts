import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

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
  async redirects() {
    return Object.entries(RENAMED_PARTS).map(([from, to]) => ({
      source: `/parts/${from}`,
      destination: `/parts/${to}`,
      permanent: true,
    })).concat(
      Object.entries(RENAMED_PARTS).filter(([from]) => from.startsWith("vk-")).map(([from, to]) => ({ source: `/sheets/${from}`, destination: `/sheets/${to}`, permanent: true })),
      Object.entries(SUPPLIER_IDS).map(([from, to]) => ({ source: `/suppliers/${from}`, destination: `/suppliers/${to}`, permanent: true })),
    );
  },
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
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
