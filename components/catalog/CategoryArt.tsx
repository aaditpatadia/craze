/**
 * Schematic line drawings used as card thumbnails until real photographs exist.
 * They show a category, never a specific product, and say so to screen readers.
 */
const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Motor() {
  return (
    <g {...common}>
      <rect x="70" y="40" width="100" height="62" rx="6" />
      <path d="M74 52h92M74 90h92" opacity=".5" />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M${84 + i * 12} 40v62`} opacity=".25" />
      ))}
      <rect x="113" y="16" width="14" height="24" rx="2" />
      <path d="M60 102h120v10H60z" />
      <path d="M78 112v8M162 112v8" opacity=".6" />
      <path d="M170 106c18 0 22 10 40 10" opacity=".7" />
    </g>
  );
}
function Esc() {
  return (
    <g {...common}>
      <rect x="50" y="34" width="140" height="72" rx="6" />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => <rect key={`${r}${c}`} x={66 + r * 26} y={46 + c * 26} width="18" height="18" rx="2" />),
      )}
      <rect x="150" y="52" width="24" height="24" rx="2" />
      <path d="M156 52v-4M162 52v-4M168 52v-4M156 80v-4M162 80v-4M168 80v-4" opacity=".6" />
      <path d="M190 50h18M190 70h18M190 90h18" />
      <path d="M50 60H34M50 80H34" />
    </g>
  );
}
function FlightController() {
  return (
    <g {...common}>
      <rect x="66" y="26" width="108" height="88" rx="8" />
      {[
        [76, 36],
        [164, 36],
        [76, 104],
        [164, 104],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" />
      ))}
      <rect x="102" y="52" width="36" height="36" rx="3" />
      <rect x="82" y="58" width="12" height="12" rx="2" opacity=".7" />
      <rect x="146" y="70" width="12" height="12" rx="2" opacity=".7" />
      <path d="M100 114v6M110 114v6M120 114v6M130 114v6M140 114v6" opacity=".6" />
    </g>
  );
}
function Propeller() {
  return (
    <g {...common}>
      <circle cx="120" cy="70" r="12" />
      <circle cx="120" cy="70" r="4" />
      <path d="M132 66c24-8 52-12 74-10 4 1 4 7 0 8-22 4-50 8-74 10" />
      <path d="M108 74c-24 8-52 12-74 10-4-1-4-7 0-8 22-4 50-8 74-10" />
    </g>
  );
}
function Frame() {
  return (
    <g {...common}>
      <rect x="100" y="50" width="40" height="40" rx="6" />
      <path d="M104 54 64 22M136 54l40-32M104 86l-40 32M136 86l40 32" />
      {[
        [60, 19],
        [180, 19],
        [60, 121],
        [180, 121],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="10" />
      ))}
    </g>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  "bldc-motors": Motor,
  escs: Esc,
  "flight-controllers": FlightController,
  propellers: Propeller,
  frames: Frame,
};

export function CategoryArt({ category, label }: { category: string; label: string }) {
  const Art = ART[category];
  return (
    <svg viewBox="0 0 240 140" className="h-full w-full text-fg-subtle" role="img" aria-label={`Schematic drawing of a ${label}, not a photo of this product`}>
      {Art ? <Art /> : <rect x="80" y="40" width="80" height="60" rx="8" fill="none" stroke="currentColor" />}
    </svg>
  );
}
