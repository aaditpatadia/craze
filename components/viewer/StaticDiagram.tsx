import type { Manifest } from "@/lib/schema";

/**
 * Static exploded diagram generated from the model manifest. Used when WebGL is
 * unavailable or the device is low-power, and as a print-friendly alternative.
 * It shows order and direction of separation, not true shape or scale.
 */
export function StaticDiagram({ manifest, selectedId, onSelect }: { manifest: Manifest; selectedId?: string | null; onSelect?: (id: string) => void }) {
  // Sort by how far each part travels up or down the main axis when exploded.
  const items = manifest.parts
    .map((p) => ({ p, y: p.axis[1] * p.distance }))
    .sort((a, b) => b.y - a.y || a.p.order - b.p.order);
  const rowH = 44;
  const width = 640;
  const height = items.length * rowH + 40;
  const blockX = 140;
  const blockW = 180;

  return (
    <figure className="h-full w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-labelledby="static-diagram-title">
        <title id="static-diagram-title">
          Exploded diagram listing {items.length} parts from top to bottom. Not to scale.
        </title>
        <line x1={blockX + blockW / 2} y1={12} x2={blockX + blockW / 2} y2={height - 12} stroke="var(--line)" strokeDasharray="3 5" />
        {items.map(({ p }, i) => {
          const y = 24 + i * rowH;
          const lateral = Math.abs(p.axis[0]) > Math.abs(p.axis[1]);
          const w = lateral ? blockW * 0.5 : blockW * 0.8;
          const x = lateral ? blockX + blockW - w + 30 : blockX + (blockW - w) / 2;
          const active = selectedId === p.id;
          return (
            <g key={p.id} className={onSelect ? "cursor-pointer" : undefined} onClick={onSelect ? () => onSelect(p.id) : undefined}>
              <rect
                x={x}
                y={y}
                width={w}
                height={rowH - 16}
                rx={6}
                fill={active ? "var(--accent-soft)" : "var(--bg-subtle)"}
                stroke={active ? "var(--accent)" : "var(--line-strong)"}
              />
              <line x1={x + w} y1={y + (rowH - 16) / 2} x2={400} y2={y + (rowH - 16) / 2} stroke="var(--line-strong)" />
              <circle cx={400} cy={y + (rowH - 16) / 2} r={2.5} fill="var(--fg-subtle)" />
              <text x={412} y={y + (rowH - 16) / 2 + 4} fontSize={13} fill={active ? "var(--accent)" : "var(--fg)"} fontWeight={active ? 600 : 400}>
                {p.name}
              </text>
              <text x={x + w / 2} y={y + (rowH - 16) / 2 + 4} fontSize={11} textAnchor="middle" fill="var(--fg-subtle)">
                {p.order + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">Numbers show assembly order. Generated from the model manifest, not to scale.</figcaption>
    </figure>
  );
}
