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

function Gnss() {
  return (
    <g {...common}>
      <path d="M70 104h100" />
      <path d="M78 104c0-34 20-56 42-56s42 22 42 56" />
      <rect x="100" y="70" width="40" height="22" rx="3" opacity=".7" />
      <path d="M120 48V28" opacity=".5" />
      <path d="M104 22a24 24 0 0 1 32 0M96 14a36 36 0 0 1 48 0" opacity=".45" />
      <path d="M120 104v14M110 118h20" opacity=".6" />
    </g>
  );
}
function Actuator() {
  return (
    <g {...common}>
      <rect x="66" y="40" width="96" height="60" rx="8" />
      <path d="M90 40v60M138 40v60" opacity=".35" />
      <rect x="162" y="32" width="14" height="76" rx="3" />
      <path d="M176 52h18M176 70h18M176 88h18" opacity=".6" />
      <circle cx="114" cy="70" r="14" opacity=".6" />
      <path d="M66 70H46" />
    </g>
  );
}
function Wheel() {
  return (
    <g {...common}>
      <circle cx="104" cy="74" r="44" />
      <circle cx="104" cy="74" r="30" opacity=".6" />
      <circle cx="104" cy="74" r="10" />
      <rect x="148" y="58" width="30" height="32" rx="4" />
      <rect x="178" y="62" width="14" height="24" rx="3" opacity=".7" />
      <path d="M104 30V16h64v42" opacity=".5" />
    </g>
  );
}
function Fan() {
  return (
    <g {...common}>
      <rect x="66" y="16" width="108" height="108" rx="10" />
      <circle cx="120" cy="70" r="46" opacity=".6" />
      <circle cx="120" cy="70" r="12" />
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const x1 = 120 + Math.cos(a) * 14;
        const y1 = 70 + Math.sin(a) * 14;
        const x2 = 120 + Math.cos(a + 0.6) * 42;
        const y2 = 70 + Math.sin(a + 0.6) * 42;
        return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(120 + Math.cos(a + 0.1) * 34).toFixed(1)} ${(70 + Math.sin(a + 0.1) * 34).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`} />;
      })}
    </g>
  );
}
function Psu() {
  return (
    <g {...common}>
      <rect x="36" y="44" width="168" height="52" rx="4" />
      <circle cx="58" cy="70" r="16" opacity=".7" />
      <path d="M86 56h90M86 70h90M86 84h90" opacity=".35" />
      <rect x="204" y="62" width="10" height="16" rx="1" />
      <path d="M36 60H24v20h12" opacity=".6" />
    </g>
  );
}
function ColdPlate() {
  return (
    <g {...common}>
      <rect x="50" y="62" width="140" height="34" rx="5" />
      <rect x="50" y="96" width="140" height="10" rx="3" opacity=".7" />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M${72 + i * 6} 66v26`} opacity=".3" />
      ))}
      <rect x="82" y="40" width="14" height="22" rx="2" />
      <rect x="144" y="40" width="14" height="22" rx="2" />
      <path d="M89 40V24h-20M151 40V24h20" opacity=".6" />
    </g>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  "bldc-motors": Motor,
  escs: Esc,
  "flight-controllers": FlightController,
  "gnss-modules": Gnss,
  propellers: Propeller,
  frames: Frame,
  "robot-actuators": Actuator,
  "robot-drive-wheels": Wheel,
  "server-fans": Fan,
  "server-power": Psu,
  "liquid-cooling": ColdPlate,
};

export function CategoryArt({ category, label, className = "h-full w-full text-fg-subtle" }: { category: string; label: string; className?: string }) {
  const Art = ART[category];
  return (
    <svg viewBox="0 0 240 140" className={className} role="img" aria-label={`Schematic drawing of a ${label}, not a photo of this product`}>
      {Art ? <Art /> : <rect x="80" y="40" width="80" height="60" rx="8" fill="none" stroke="currentColor" />}
    </svg>
  );
}
