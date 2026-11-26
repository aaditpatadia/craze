import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const grid =
  "linear-gradient(rgba(234,242,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,0.13) 1px, transparent 1px), linear-gradient(rgba(234,242,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,0.06) 1px, transparent 1px)";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 36, background: "#0c3a78", backgroundImage: grid, backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px", color: "#eaf2ff" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", border: "3px solid #eaf2ff", padding: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="64" height="64" viewBox="0 0 32 32">
              <rect x="2.75" y="2.75" width="26.5" height="26.5" rx="2" fill="none" stroke="#eaf2ff" strokeWidth="1.5" />
              <path d="M8 8h16v3.6h-6.2V24h-3.6V11.6H8z" fill="#eaf2ff" />
              <path d="M21 21h4.25v4.25H21z" fill="#9ccbff" />
            </svg>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: 10 }}>TIMULE</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1 }}>One code for every critical part.</div>
            <div style={{ fontSize: 28, color: "rgba(234,242,255,0.75)", marginTop: 22, maxWidth: 950 }}>
              Drone, robotics and data center components with a build sheet and the evidence behind every claim.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#9ccbff", fontFamily: "monospace" }}>
            <span>TM-MOT-2807-1300-A</span>
            <span>TMS-001</span>
            <span>TMQ-261126-7KQ4</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
