import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#0a0a0b", color: "#f5f5f7" }}>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{SITE.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>Know exactly what you are buying.</div>
          <div style={{ fontSize: 30, color: "#98989f", marginTop: 24, maxWidth: 900 }}>{SITE.promise}</div>
        </div>
      </div>
    ),
    size,
  );
}
