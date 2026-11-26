/** Technical drawings for ESC options. SVG in currentColor, like the motor drawings. */

const ink = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const thin = { ...ink, strokeWidth: 0.8, opacity: 0.55 };
const txt = { fontSize: 10, fill: "currentColor", fontFamily: "ui-monospace, Menlo, Consolas, monospace" } as const;
const accent = "var(--accent, var(--bp-accent, currentColor))";

/** Top view of the board: pads, mounting holes and cooling. */
export function BoardDiagram({ layout, mount, cooling, amps }: { layout: string; mount: string; cooling: string; amps: number }) {
  const four = layout === "4";
  const pad = (x: number, y: number, k: string) => <rect key={k} x={x} y={y} width={9} height={7} rx={1.5} fill="none" stroke={accent} strokeWidth={1.3} />;
  return (
    <svg viewBox="0 0 320 172" className="h-auto w-full" role="img" aria-label={`${four ? "4-in-1" : "Single channel"} ESC board, ${amps} A`}>
      {four ? (
        <g>
          <rect x={95} y={20} width={130} height={126} rx={8} {...ink} />
          {cooling === "SINK" ? Array.from({ length: 9 }).map((_, i) => <line key={i} x1={115 + i * 11} y1={45} x2={115 + i * 11} y2={120} {...thin} />) : null}
          {cooling === "CASE" ? <rect x={89} y={14} width={142} height={138} rx={12} {...ink} strokeDasharray="5 3" /> : null}
          {[
            [100, 25],
            [196, 25],
            [100, 128],
            [196, 128],
          ].map(([x, y], m) => (
            <g key={m}>
              {[0, 1, 2].map((i) => pad(x! + (m % 2 ? -i * 11 + 11 : i * 11 - 0), y!, `${m}${i}`))}
              <text x={m % 2 ? x! + 4 : x! + 10} y={m < 2 ? y! + 20 : y! - 6} textAnchor="middle" {...txt} fontSize={8} opacity={0.7}>
                M{m + 1}
              </text>
            </g>
          ))}
          {mount === "20" || mount === "30" || mount === "45"
            ? (() => {
                const s = mount === "20" ? 40 : mount === "30" ? 62 : 90;
                const x0 = 160 - s / 2;
                const y0 = 83 - s / 2;
                return (
                  <g>
                    {[
                      [x0, y0],
                      [x0 + s, y0],
                      [x0, y0 + s],
                      [x0 + s, y0 + s],
                    ].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r={3.5} {...ink} />
                    ))}
                    <line x1={x0} y1={154} x2={x0 + s} y2={154} {...thin} />
                    <line x1={x0} y1={y0 + s} x2={x0} y2={158} {...thin} strokeDasharray="2 2" />
                    <line x1={x0 + s} y1={y0 + s} x2={x0 + s} y2={158} {...thin} strokeDasharray="2 2" />
                    <text x={160} y={167} textAnchor="middle" {...txt}>
                      {mount === "20" ? "20 × 20" : mount === "30" ? "30.5 × 30.5" : "45 × 45"} mm
                    </text>
                  </g>
                );
              })()
            : null}
          <text x={160} y={88} textAnchor="middle" {...txt} fontWeight={700}>
            4 × {amps} A
          </text>
        </g>
      ) : (
        <g>
          <rect x={70} y={55} width={180} height={56} rx={8} {...ink} />
          {cooling === "SINK" ? Array.from({ length: 12 }).map((_, i) => <line key={i} x1={100 + i * 11} y1={62} x2={100 + i * 11} y2={104} {...thin} />) : null}
          {cooling === "CASE" ? <rect x={64} y={49} width={192} height={68} rx={12} {...ink} strokeDasharray="5 3" /> : null}
          {[0, 1, 2].map((i) => (
            <line key={i} x1={250} y1={68 + i * 15} x2={300} y2={68 + i * 15} stroke={accent} strokeWidth={2.4} strokeLinecap="round" />
          ))}
          <text x={290} y={58} textAnchor="middle" {...txt} fontSize={8} opacity={0.7}>
            TO MOTOR
          </text>
          <line x1={70} y1={72} x2={20} y2={72} stroke="currentColor" strokeWidth={2.4} />
          <line x1={70} y1={94} x2={20} y2={94} stroke="currentColor" strokeWidth={2.4} opacity={0.6} />
          <text x={30} y={62} {...txt} fontSize={8} opacity={0.7}>
            + −
          </text>
          <path d="M120 111 C120 140 150 140 160 150" {...thin} />
          <text x={170} y={154} {...txt} fontSize={8} opacity={0.7}>
            SIGNAL
          </text>
          <text x={160} y={88} textAnchor="middle" {...txt} fontWeight={700}>
            {amps} A
          </text>
          {mount === "PLATE" ? <rect x={60} y={115} width={200} height={8} {...ink} /> : null}
          {mount === "ARM" ? (
            <g>
              <rect x={40} y={128} width={240} height={14} rx={7} {...thin} />
              <text x={160} y={166} textAnchor="middle" {...txt} fontSize={8} opacity={0.7}>
                ARM
              </text>
            </g>
          ) : null}
        </g>
      )}
    </svg>
  );
}

/** The buyer's motor current against the ESC rating, at hover and at peak. */
export function LoadBars({ hover, peak, amps, peakAmps }: { hover: number; peak: number; amps: number; peakAmps: number }) {
  const max = Math.max(peakAmps, peak, amps) * 1.1;
  const x = (a: number) => 70 + (a / max) * 220;
  const bar = (y: number, label: string, v: number, limit: number) => {
    const over = v > limit;
    return (
      <g>
        <text x={8} y={y + 13} {...txt}>
          {label}
        </text>
        <rect x={70} y={y} width={220} height={18} {...thin} />
        <rect x={70} y={y} width={Math.max(0, x(v) - 70)} height={18} fill={over ? "#e5484d" : accent} opacity={0.55} />
        <line x1={x(limit)} y1={y - 6} x2={x(limit)} y2={y + 24} stroke="currentColor" strokeWidth={1.6} />
        <text x={x(limit)} y={y - 9} textAnchor="middle" {...txt} fontSize={9}>
          {limit} A
        </text>
        <text x={Math.min(x(v) + 4, 260)} y={y + 13} {...txt} fontWeight={700}>
          {v} A
        </text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 320 130" className="h-auto w-full" role="img" aria-label={`Hover ${hover} A against ${amps} A, peak ${peak} A against ${peakAmps} A`}>
      {bar(28, "HOVER", hover, amps)}
      {bar(82, "PEAK", peak, peakAmps)}
    </svg>
  );
}

/** What the throttle signal looks like on the wire. */
export function SignalDiagram({ protocol }: { protocol: string }) {
  let path = "";
  if (protocol === "PWM") {
    path = "M10 90 H40 V40 H95 V90 H160 V40 H215 V90 H280 V40 H310";
  } else if (protocol === "CAN") {
    path = "M10 55 H50 V75 H80 V55 H100 V75 H150 V55 H170 V75 H230 V55 H260 V75 H310";
  } else {
    const bits = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
    let x = 10;
    path = "M10 90";
    for (const b of bits) {
      const hi = b ? 12 : 6;
      path += ` V40 H${x + hi} V90 H${x + 18}`;
      x += 18;
    }
  }
  return (
    <svg viewBox="0 0 320 130" className="h-auto w-full" role="img" aria-label={`${protocol} throttle signal`}>
      <line x1={10} y1={90} x2={310} y2={90} {...thin} />
      <path d={path} fill="none" stroke={accent} strokeWidth={1.8} />
      {protocol === "CAN" ? <path d="M10 75 H50 V55 H80 V75 H100 V55 H150 V75 H170 V55 H230 V75 H260 V55 H310" fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.6} /> : null}
      <text x={160} y={118} textAnchor="middle" {...txt} opacity={0.75}>
        {protocol === "PWM"
          ? "PWM: THROTTLE = PULSE WIDTH, 1000-2000 µs"
          : protocol === "CAN"
            ? "CAN: TWO WIRES, ONE BUS, DATA BOTH WAYS"
            : "DSHOT: 11 THROTTLE BITS + TELEMETRY + CHECKSUM"}
      </text>
    </svg>
  );
}

/** Where power goes: battery to ESC to motor, and to the flight controller if there is a BEC. */
export function PowerFlow({ bec, cellsLabel }: { bec: string; cellsLabel: string }) {
  const box = (x: number, y: number, w: number, label: string, sub?: string) => (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={6} {...ink} />
      <text x={x + w / 2} y={y + 15} textAnchor="middle" {...txt} fontWeight={700}>
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + 27} textAnchor="middle" {...txt} fontSize={8} opacity={0.7}>
          {sub}
        </text>
      ) : null}
    </g>
  );
  const has = bec !== "NONE";
  return (
    <svg viewBox="0 0 320 130" className="h-auto w-full" role="img" aria-label={has ? `ESC powers the flight controller through a ${bec} BEC` : "Flight controller powered separately"}>
      {box(8, 20, 76, "BATTERY", cellsLabel)}
      {box(122, 20, 76, "ESC")}
      {box(236, 20, 76, "MOTOR")}
      <line x1={84} y1={37} x2={122} y2={37} stroke="currentColor" strokeWidth={2} />
      <line x1={198} y1={37} x2={236} y2={37} stroke="currentColor" strokeWidth={2} />
      {box(122, 86, 76, "FLIGHT CTRL", has ? bec.replace("V", " V ").replace(/(\d)$/, "$1 A") : "SEPARATE BEC")}
      <line x1={160} y1={54} x2={160} y2={86} stroke={has ? accent : "currentColor"} strokeWidth={has ? 2 : 1} strokeDasharray={has ? undefined : "4 3"} opacity={has ? 1 : 0.5} />
    </svg>
  );
}
