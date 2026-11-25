import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** Part ids before the move to VK codes. Old links keep working. */
const RENAMED_PARTS: Record<string, string> = {
  "hm-2807-1300kv": "vk-mot-2807-1300",
  "hm-4114-400kv": "vk-mot-4114-400",
  "la-esc-45a": "vk-esc-45-6s",
  "la-esc-80a-hv": "vk-esc-80-14s",
  "la-fc-h7": "vk-fct-h7-30",
  "sw-cf1550-fold": "vk-prp-1550-f2",
  "sw-5143-tri": "vk-prp-5143-3",
  "qc-x650-frame": "vk-frm-650-x4",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(RENAMED_PARTS).map(([from, to]) => ({
      source: `/parts/${from}`,
      destination: `/parts/${to}`,
      permanent: true,
    }));
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
