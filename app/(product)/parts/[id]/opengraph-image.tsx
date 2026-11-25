import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config";
import { getProduct, getProducts, highestTier } from "@/lib/content";
import { TIER_LABEL, formatSpecValue, originLabel } from "@/lib/format";

export const alt = "Part summary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getProducts().map((p) => ({ id: p.id }));
}

export default async function PartOg({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProduct(id);
  const specs = p?.specs.slice(0, 3) ?? [];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0a0a0b", color: "#f5f5f7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#98989f" }}>
          <span>{SITE.name}</span>
          {p?.placeholder ? <span style={{ border: "2px dashed #98989f", borderRadius: 999, padding: "4px 18px", fontSize: 22 }}>SAMPLE DATA</span> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1.5 }}>{p?.name ?? "Part"}</div>
          <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
            {specs.map((s) => (
              <div key={s.key} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 22, color: "#98989f" }}>{s.label}</span>
                <span style={{ fontSize: 36, fontWeight: 600 }}>{formatSpecValue(s.value, s.unit)}</span>
              </div>
            ))}
          </div>
        </div>
        {p ? (
          <div style={{ display: "flex", gap: 32, fontSize: 24, color: "#d1d1d6" }}>
            <span>Highest evidence: {TIER_LABEL[highestTier(p)]}</span>
            <span>Origin: {originLabel(p.origin.country)}</span>
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
