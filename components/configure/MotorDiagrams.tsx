/**
 * Small technical drawings that show what each motor option means. Pure SVG in
 * currentColor, so they work on the site, on blueprints and on paper.
 */
import { frameDims, type Pattern } from "@/lib/motor-config";

const ink = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const thin = { ...ink, strokeWidth: 0.8, opacity: 0.55 };
const dim = { fontSize: 10, fill: "currentColor", fontFamily: "ui-monospace, Menlo, Consolas, monospace" } as const;
const accent = "var(--accent, var(--bp-accent, currentColor))";

function DimLine({ x1, y1, x2, y2, text, offset = 0 }: { x1: number; y1: number; x2: number; y2: number; text: string; offset?: number }) {
  const vertical = x1 === x2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} {...thin} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x={vertical ? x1 + 6 + offset : (x1 + x2) / 2} y={vertical ? (y1 + y2) / 2 + 3 : y1 - 5 + offset} textAnchor={vertical ? "start" : "middle"} {...dim}>
        {text}
      </text>
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 2 L8 5 L0 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </marker>
    </defs>
  );
}

/** Stator size: top view (diameter) and side view (height), drawn to the same scale. */
export function StatorDiagram({ size }: { size: string }) {
  const { d, h } = frameDims(size);
  const s = Math.min(110 / d, 2.2);
  const r = (d * s) / 2;
  const hh = Math.max(h * s, 6);
  const cx = 80;
  const cy = 80;
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label={`Stator ${d} mm across and ${h} mm tall`}>
      <Defs />
      <circle cx={cx} cy={cy} r={r} {...ink} />
      <circle cx={cx} cy={cy} r={r * 0.55} {...thin} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={cx + Math.cos(a) * r * 0.58} y1={cy + Math.sin(a) * r * 0.58} x2={cx + Math.cos(a) * r * 0.95} y2={cy + Math.sin(a) * r * 0.95} {...thin} />;
      })}
      <DimLine x1={cx - r} y1={cy - r - 10} x2={cx + r} y2={cy - r - 10} text={`${d} mm`} />
      <rect x={200} y={cy - hh / 2} width={r * 2 > 100 ? 100 : r * 2} height={hh} {...ink} />
      <DimLine x1={200 + Math.min(r * 2, 100) + 10} y1={cy - hh / 2} x2={200 + Math.min(r * 2, 100) + 10} y2={cy + hh / 2} text={`${h} mm`} />
      <text x={cx} y={154} textAnchor="middle" {...dim} opacity={0.7}>
        TOP: DIAMETER
      </text>
      <text x={250} y={154} textAnchor="middle" {...dim} opacity={0.7}>
        SIDE: HEIGHT
      </text>
    </svg>
  );
}

/** KV times voltage: the no-load speed, as a dial. */
export function KvDiagram({ kv, volts }: { kv: number; volts: number }) {
  const rpm = kv * volts;
  const frac = Math.min(rpm / 40000, 1);
  const a = Math.PI * (1 - frac);
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label={`About ${Math.round(rpm)} rpm with no load`}>
      <path d="M40 130 A120 120 0 0 1 280 130" {...thin} />
      <path d={`M40 130 A120 120 0 0 1 ${160 + Math.cos(a) * 120} ${130 - Math.sin(a) * 120}`} fill="none" stroke={accent} strokeWidth={4} strokeLinecap="round" />
      <line x1={160} y1={130} x2={160 + Math.cos(a) * 96} y2={130 - Math.sin(a) * 96} {...ink} />
      <circle cx={160} cy={130} r={4} fill="currentColor" />
      <text x={160} y={98} textAnchor="middle" {...dim} fontSize={18} fontWeight={600}>
        {Math.round(rpm).toLocaleString("en-IN")} rpm
      </text>
      <text x={160} y={152} textAnchor="middle" {...dim} opacity={0.7}>
        {kv} KV × {volts} V, NO LOAD
      </text>
      <text x={34} y={150} {...dim} opacity={0.5}>
        0
      </text>
      <text x={262} y={150} {...dim} opacity={0.5}>
        40k
      </text>
    </svg>
  );
}

/** Shaft: side view of the bell with the shaft, styled by type. */
export function ShaftDiagram({ dia, style }: { dia: number; style: string }) {
  const w = Math.max(4, dia * 2.4);
  const x = 160 - w / 2;
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label={`Shaft ${dia} mm`}>
      <Defs />
      <rect x={90} y={80} width={140} height={46} rx={6} {...ink} />
      <line x1={90} y1={92} x2={230} y2={92} {...thin} />
      <rect x={x} y={30} width={w} height={50} {...ink} stroke={accent} />
      {style === "T"
        ? Array.from({ length: 7 }).map((_, i) => <line key={i} x1={x} y1={34 + i * 6} x2={x + w} y2={38 + i * 6} {...thin} />)
        : null}
      {style === "H" ? <rect x={160 - w / 5} y={30} width={(w * 2) / 5} height={50} {...thin} strokeDasharray="3 3" /> : null}
      {style === "K" ? <rect x={x + w - 3} y={40} width={3} height={22} fill="currentColor" /> : null}
      <DimLine x1={x} y1={22} x2={x + w} y2={22} text={`ø${dia} mm`} />
      <text x={160} y={150} textAnchor="middle" {...dim} opacity={0.7}>
        {style === "P" ? "PLAIN" : style === "T" ? "THREADED" : style === "H" ? "HOLLOW" : "KEYED"} SHAFT
      </text>
    </svg>
  );
}

/** A bolt circle: n holes of a screw size on a pitch circle. */
export function PatternDiagram({ p, title }: { p: Pattern; title: string }) {
  const r = Math.min(56, 18 + p.pcd * 0.5);
  const hole = Math.max(3, Number(p.screw.slice(1)) * 1.3);
  const cx = 110;
  const cy = 76;
  return (
    <svg viewBox="0 0 320 160" className="h-auto w-full" role="img" aria-label={`${p.n} ${p.screw} holes on a ${p.pcd} mm circle`}>
      <Defs />
      <circle cx={cx} cy={cy} r={r + 16} {...ink} />
      <circle cx={cx} cy={cy} r={r} {...thin} strokeDasharray="4 3" />
      {Array.from({ length: p.n }).map((_, i) => {
        const a = (i / p.n) * Math.PI * 2 + (p.n === 4 ? Math.PI / 4 : 0);
        return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={hole} fill="none" stroke={accent} strokeWidth={1.6} />;
      })}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} {...thin} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x={210} y={62} {...dim} fontSize={13} fontWeight={600}>
        {p.n} × {p.screw}
      </text>
      <text x={210} y={82} {...dim}>
        on ø{p.pcd} mm
      </text>
      <text x={210} y={100} {...dim} opacity={0.7}>
        pitch circle
      </text>
      <text x={cx} y={154} textAnchor="middle" {...dim} opacity={0.7}>
        {title}
      </text>
    </svg>
  );
}

/** Temperature limits on one scale, with the chosen one marked. */
export function TempScale({ marks, value, title }: { marks: { label: string; t: number }[]; value: number; title: string }) {
  const x = (t: number) => 30 + ((t - 60) / 140) * 260;
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label={`${title}: ${value} °C`}>
      <line x1={30} y1={60} x2={290} y2={60} {...ink} />
      {[60, 100, 140, 180].map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={56} x2={x(t)} y2={64} {...thin} />
          <text x={x(t)} y={80} textAnchor="middle" {...dim} opacity={0.5}>
            {t}°
          </text>
        </g>
      ))}
      <rect x={30} y={54} width={x(value) - 30} height={12} fill={accent} opacity={0.35} />
      {marks.map((m) => (
        <g key={m.label}>
          <line x1={x(m.t)} y1={36} x2={x(m.t)} y2={60} stroke={m.t === value ? accent : "currentColor"} strokeWidth={m.t === value ? 2 : 1} opacity={m.t === value ? 1 : 0.5} />
          <text x={x(m.t)} y={30} textAnchor="middle" {...dim} fontWeight={m.t === value ? 700 : 400} opacity={m.t === value ? 1 : 0.6}>
            {m.label}
          </text>
        </g>
      ))}
      <text x={160} y={108} textAnchor="middle" {...dim} opacity={0.7}>
        {title.toUpperCase()}
      </text>
    </svg>
  );
}

/** Three phase leads to scale against the motor, ending in the chosen connector. */
export function LeadsDiagram({ length, awg, connector }: { length: number; awg: number; connector: string }) {
  const len = Math.min(200, 30 + length * 0.3);
  const w = Math.max(1.2, (24 - awg) * 0.45);
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label={`${length} mm leads, ${awg} AWG, ${connector}`}>
      <Defs />
      <rect x={20} y={30} width={50} height={50} rx={6} {...ink} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <line x1={70} y1={44 + i * 11} x2={70 + len} y2={44 + i * 11} stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
          {connector !== "BARE" ? <rect x={70 + len} y={40 + i * 11} width={14} height={8} fill="none" stroke={accent} strokeWidth={1.4} /> : null}
        </g>
      ))}
      <DimLine x1={70} y1={92} x2={70 + len} y2={92} text={`${length} mm`} offset={22} />
      <text x={160} y={14} textAnchor="middle" {...dim} opacity={0.7}>
        {awg} AWG · {connector === "BARE" ? "TINNED ENDS" : connector}
      </text>
    </svg>
  );
}

/** A short ladder of choices with the selected step marked. */
export function Ladder({ steps, value }: { steps: { id: string; label: string }[]; value: string }) {
  const i = steps.findIndex((s) => s.id === value);
  return (
    <svg viewBox={`0 0 320 ${steps.length * 30 + 10}`} className="h-auto w-full" role="img" aria-label={steps[i]?.label}>
      {steps.map((s, k) => (
        <g key={s.id}>
          <rect x={20 + k * 14} y={8 + k * 30} width={260 - k * 14} height={22} rx={4} fill={k <= i ? accent : "none"} opacity={k <= i ? (k === i ? 0.45 : 0.18) : 1} stroke="currentColor" strokeWidth={k === i ? 1.6 : 0.8} />
          <text x={30 + k * 14} y={23 + k * 30} {...dim} fontWeight={k === i ? 700 : 400}>
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
