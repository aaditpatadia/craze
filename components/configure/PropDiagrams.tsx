/** Technical drawings for propeller options. SVG in currentColor. */

const ink = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const thin = { ...ink, strokeWidth: 0.8, opacity: 0.55 };
const txt = { fontSize: 10, fill: "currentColor", fontFamily: "ui-monospace, Menlo, Consolas, monospace" } as const;
const accent = "var(--accent, var(--bp-accent, currentColor))";

function Marker() {
  return (
    <defs>
      <marker id="parr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 2 L8 5 L0 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </marker>
    </defs>
  );
}

/** Top view: the disc, the blades, fold hinges and the spin direction. */
export function PropTopView({ dia, blades, style, rotation }: { dia: number; blades: number; style: string; rotation: string }) {
  const cx = 160;
  const cy = 82;
  const R = 70;
  const blade = (a: number, k: number) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const pt = (r: number, w: number) => `${cx + ca * r - sa * w} ${cy + sa * r + ca * w}`;
    const d = `M${pt(12, -5)} C${pt(30, -13)} ${pt(55, -9)} ${pt(R, -3)} L${pt(R, 2)} C${pt(55, 6)} ${pt(30, 7)} ${pt(12, 5)} Z`;
    return (
      <g key={k}>
        <path d={d} {...ink} />
        {style === "FOLD" ? <circle cx={cx + ca * 16} cy={cy + sa * 16} r={2.4} fill={accent} /> : null}
      </g>
    );
  };
  const cw = rotation !== "CCW";
  return (
    <svg viewBox="0 0 320 182" className="h-auto w-full" role="img" aria-label={`${dia} inch, ${blades} blade propeller`}>
      <Marker />
      <circle cx={cx} cy={cy} r={R} {...thin} strokeDasharray="4 4" />
      {Array.from({ length: blades }).map((_, i) => blade((i / blades) * Math.PI * 2 - Math.PI / 2, i))}
      <circle cx={cx} cy={cy} r={11} {...ink} />
      <path d={cw ? `M${cx + 52} ${cy - 52} A74 74 0 0 1 ${cx + 72} ${cy - 14}` : `M${cx - 52} ${cy - 52} A74 74 0 0 0 ${cx - 72} ${cy - 14}`} fill="none" stroke={accent} strokeWidth={1.8} markerEnd="url(#parr)" />
      <line x1={cx - R} y1={cy + R + 8} x2={cx + R} y2={cy + R + 8} {...thin} markerStart="url(#parr)" markerEnd="url(#parr)" />
      <text x={cx} y={cy + R + 22} textAnchor="middle" {...txt}>
        {dia} in · {Math.round(dia * 25.4)} mm
      </text>
      <text x={20} y={20} {...txt} opacity={0.7}>
        {rotation === "PAIR" ? "CW + CCW PAIR" : cw ? "CW" : "CCW"}
      </text>
      {style === "FOLD" ? (
        <text x={300} y={20} textAnchor="end" {...txt} opacity={0.7}>
          FOLDING HINGES
        </text>
      ) : null}
    </svg>
  );
}

/** Pitch: how far one turn would screw the propeller forward, drawn as a helix unrolled. */
export function PitchDiagram({ dia, pitch }: { dia: number; pitch: number }) {
  const circ = Math.PI * dia * 0.75; // circumference at 75 percent radius, where pitch is measured
  const w = 240;
  const h = Math.min(100, (pitch / circ) * w);
  const angle = Math.round((Math.atan(pitch / circ) * 180) / Math.PI);
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label={`Pitch ${pitch} inches, blade angle about ${angle} degrees`}>
      <Marker />
      <line x1={40} y1={120} x2={40 + w} y2={120} {...thin} />
      <line x1={40} y1={120} x2={40 + w} y2={120 - h} stroke={accent} strokeWidth={2} />
      <line x1={40 + w + 10} y1={120} x2={40 + w + 10} y2={120 - h} {...thin} markerStart="url(#parr)" markerEnd="url(#parr)" />
      <text x={40 + w + 14} y={120 - h / 2 + 3} {...txt} fontSize={9}>
        {pitch}&quot;
      </text>
      <path d={`M80 120 A40 40 0 0 0 ${40 + 40 * Math.cos((angle * Math.PI) / 180)} ${120 - 40 * Math.sin((angle * Math.PI) / 180)}`} {...thin} />
      <text x={86} y={112} {...txt} fontSize={9}>
        {angle}°
      </text>
      <text x={40 + w / 2} y={138} textAnchor="middle" {...txt} opacity={0.75}>
        ONE TURN AT 75% RADIUS: {Math.round(circ)} in
      </text>
      <text x={40} y={20} {...txt} opacity={0.75}>
        ADVANCES {pitch} in PER TURN, NO SLIP
      </text>
    </svg>
  );
}

/** Stiffness and weight of the chosen material against the others. */
export function MaterialBars({ props, current }: { props: Record<string, { stiff: number; weight: number }>; current: string }) {
  const ids = Object.keys(props);
  return (
    <svg viewBox="0 0 320 140" className="h-auto w-full" role="img" aria-label={`Material ${current}`}>
      <text x={120} y={14} textAnchor="middle" {...txt} opacity={0.7}>
        STIFFNESS
      </text>
      <text x={250} y={14} textAnchor="middle" {...txt} opacity={0.7}>
        WEIGHT
      </text>
      {ids.map((id, i) => {
        const p = props[id]!;
        const y = 28 + i * 36;
        const sel = id === current;
        return (
          <g key={id} opacity={sel ? 1 : 0.55}>
            <text x={8} y={y + 13} {...txt} fontWeight={sel ? 700 : 400}>
              {id}
            </text>
            <rect x={60} y={y} width={120 * p.stiff} height={18} fill={sel ? accent : "currentColor"} opacity={sel ? 0.6 : 0.25} />
            <rect x={190} y={y} width={120 * p.weight} height={18} fill={sel ? accent : "currentColor"} opacity={sel ? 0.6 : 0.25} />
          </g>
        );
      })}
    </svg>
  );
}

/** Blade tip speed against the speed of sound. */
export function TipSpeed({ ms, mach }: { ms: number; mach: number }) {
  const x = (m: number) => 30 + Math.min(m, 1) * 260;
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full" role="img" aria-label={`Tip speed ${ms} metres per second, Mach ${mach}`}>
      <rect x={30} y={50} width={260} height={16} {...thin} />
      <rect x={x(0.6)} y={50} width={x(0.8) - x(0.6)} height={16} fill="#f5a524" opacity={0.25} />
      <rect x={x(0.8)} y={50} width={x(1) - x(0.8)} height={16} fill="#e5484d" opacity={0.25} />
      <rect x={30} y={50} width={x(mach) - 30} height={16} fill={accent} opacity={0.55} />
      <text x={x(mach)} y={40} textAnchor="middle" {...txt} fontWeight={700}>
        {ms} m/s · M{mach}
      </text>
      {[0, 0.6, 0.8, 1].map((m) => (
        <text key={m} x={x(m)} y={84} textAnchor="middle" {...txt} fontSize={9} opacity={0.6}>
          M{m}
        </text>
      ))}
      <text x={160} y={108} textAnchor="middle" {...txt} opacity={0.75}>
        TIP SPEED AT MAXIMUM RPM
      </text>
    </svg>
  );
}

/** Centre bore for shaft-mounted propellers. */
export function BoreDiagram({ bore }: { bore: number }) {
  const r = 14 + bore * 2;
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label={`${bore} mm centre bore`}>
      <Marker />
      <circle cx={110} cy={72} r={56} {...ink} />
      <circle cx={110} cy={72} r={r / 2} stroke={accent} strokeWidth={1.8} fill="none" />
      <line x1={110 - r / 2} y1={72} x2={110 + r / 2} y2={72} {...thin} markerStart="url(#parr)" markerEnd="url(#parr)" />
      <text x={200} y={68} {...txt} fontSize={13} fontWeight={600}>
        ø{bore} mm
      </text>
      <text x={200} y={86} {...txt} opacity={0.7}>
        centre bore
      </text>
      <text x={110} y={144} textAnchor="middle" {...txt} opacity={0.7}>
        HUB, TOP VIEW
      </text>
    </svg>
  );
}
