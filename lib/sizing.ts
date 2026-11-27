/**
 * Propulsion sizing for multirotors. Plain TypeScript, shared by the tool, its sheet and the
 * parameter-file downloads.
 *
 * Physics: momentum theory for hover power, a figure of merit for real propellers, a thrust
 * coefficient for rpm, and typical motor and ESC efficiencies. Air density comes from the
 * altitude and temperature the buyer flies in, which matters in an Indian summer: at 45 °C and
 * 1,000 m the air is about 20% thinner than the 15 °C sea-level figure most datasheets use.
 * Results are estimates to within about 15%. A thrust-stand test decides.
 */
import { CELL_VOLTS, FRAMES, frameDims } from "./motor-config";
import { CONT_AMPS, ESC_DEFAULT, escCode, escToParams, type EscConfig } from "./esc-config";
import { DIAMETERS, propCode, propDefaults, propToParams, tipSpeed, type PropConfig } from "./prop-config";

export type Chem = "LIPO" | "LIION";
export const CHEM: Record<Chem, { label: string; nominal: number; whPerKg: number; maxC: number; usable: number; empty: number; full: number }> = {
  LIPO: { label: "LiPo", nominal: 3.7, whPerKg: 165, maxC: 40, usable: 0.8, empty: 3.5, full: 4.2 },
  LIION: { label: "Li-ion", nominal: 3.6, whPerKg: 210, maxC: 8, usable: 0.85, empty: 3.1, full: 4.2 },
};

export type SizingInput = {
  /** Aircraft without battery or payload, kg. */
  dry: number;
  payload: number;
  rotors: number;
  coax: boolean;
  /** Largest propeller the frame takes, inches. */
  maxProp: number;
  cells: number;
  capacity: number;
  chem: Chem;
  /** Thrust-to-weight ratio at full throttle. */
  twr: number;
  altitude: number;
  temp: number;
  /** Flight controller, radios, camera, pump: watts drawn the whole flight. */
  avionics: number;
};

export const SIZING_DEFAULT: SizingInput = {
  dry: 9,
  payload: 10,
  rotors: 6,
  coax: false,
  maxProp: 24,
  cells: 12,
  capacity: 22000,
  chem: "LIPO",
  twr: 1.8,
  altitude: 500,
  temp: 40,
  avionics: 60,
};

export const ROTOR_CHOICES = [4, 6, 8];
export const CELL_CHOICES = [6, 12, 14, 24];
const G = 9.80665;
const CT = 0.095;
const ETA_HOVER = 0.85;
const ETA_MAX = 0.78;
const COAX_POWER = 1.22;

export function airDensity(altitude: number, temp: number) {
  const p = 101325 * Math.pow(1 - 2.25577e-5 * altitude, 5.25588);
  return p / (287.05 * (temp + 273.15));
}

const fm = (dIn: number) => (dIn >= 20 ? 0.72 : dIn >= 15 ? 0.68 : dIn >= 9 ? 0.62 : 0.56);

export const batteryKg = (i: Pick<SizingInput, "cells" | "capacity" | "chem">) => (i.cells * CHEM[i.chem].nominal * (i.capacity / 1000)) / CHEM[i.chem].whPerKg;

/** Hover only: used for the flight-time curve, where the battery weight changes. */
function hover(i: SizingInput, capacity: number) {
  const rho = airDensity(i.altitude, i.temp);
  const mass = i.dry + i.payload + batteryKg({ ...i, capacity });
  const T = (mass * G) / i.rotors;
  const A = Math.PI * Math.pow((i.maxProp * 0.0254) / 2, 2);
  const P = (Math.pow(T, 1.5) / Math.sqrt(2 * rho * A) / fm(i.maxProp) / ETA_HOVER) * (i.coax ? COAX_POWER : 1);
  const V = i.cells * CHEM[i.chem].nominal;
  const I = (P * i.rotors + i.avionics) / V;
  const minutes = ((capacity / 1000) * CHEM[i.chem].usable * 60) / I;
  return { rho, mass, T, A, P, V, I, minutes };
}

type FrameHit = { size: string; kv: number; cells: string; kvOff: number; standard: boolean };

const range = (s: string) => {
  const n = s.replace(/[^\d-]/g, "").split("-").map(Number);
  return [n[0]!, n[1] ?? n[0]!] as const;
};
const cellRange = (s: string) => {
  const [a, b] = range(s);
  return [a, b] as const;
};

const vol = (f: { size: string }) => frameDims(f.size).d ** 2 * frameDims(f.size).h;
const inRange = (f: { props: string }, prop: number) => {
  const [lo, hi] = range(f.props);
  return prop >= lo && prop <= hi;
};

export function pickMotor(prop: number, cells: number, kvNeed: number): FrameHit[] {
  const hits: FrameHit[] = [];
  for (const f of FRAMES) {
    const [lo, hi] = range(f.props);
    if (prop < lo - 1 || prop > hi + 1) continue;
    if (!f.uses.some((u) => u !== "fixed-wing")) continue;
    for (const k of f.kvs) {
      const [cl, ch] = cellRange(k.cells);
      if (cells < cl || cells > ch) continue;
      hits.push({ size: f.size, kv: k.kv, cells: `${cells}S`, kvOff: (k.kv - kvNeed) / kvNeed, standard: true });
    }
  }
  hits.sort((a, b) => Math.abs(a.kvOff) - Math.abs(b.kvOff));
  const best = hits.slice(0, 3);
  const fits = (f: { props: string }) => (inRange(f, prop) ? 0 : 1);
  if (!best.length || Math.abs(best[0]!.kvOff) > 0.2) {
    // No standard winding close enough: the nearest frame for this propeller, wound to the KV needed.
    const frame =
      FRAMES.filter((f) => {
        const [lo, hi] = range(f.props);
        return prop >= lo - 2 && prop <= hi + 2 && f.uses.some((u) => u !== "fixed-wing");
      }).sort((a, b) => fits(a) - fits(b) || vol(b) - vol(a))[0] ?? FRAMES.at(-1)!;
    const kv = Math.max(10, Math.round(kvNeed / 10) * 10);
    best.unshift({ size: frame.size, kv, cells: `${cells}S`, kvOff: (kv - kvNeed) / kvNeed, standard: false });
  }
  return best.slice(0, 3);
}

const AWG: [number, number][] = [
  [20, 15],
  [18, 22],
  [16, 30],
  [14, 40],
  [12, 55],
  [10, 75],
  [8, 100],
  [6, 140],
];
export const awgFor = (amps: number) => (AWG.find(([, a]) => a >= amps) ?? AWG.at(-1)!)[0];

export type Warning = { level: "warn" | "stop"; text: string };

export type SizingResult = ReturnType<typeof size>;

export function size(i: SizingInput) {
  const h = hover(i, i.capacity);
  const prop = DIAMETERS.filter((d) => d <= i.maxProp).at(-1) ?? DIAMETERS[0]!;
  const D = prop * 0.0254;
  const Tmax = h.T * i.twr;
  const Pmax = (Math.pow(Tmax, 1.5) / Math.sqrt(2 * h.rho * h.A) / (fm(i.maxProp) * 0.92) / ETA_MAX) * (i.coax ? COAX_POWER : 1);
  const Vsag = i.cells * CHEM[i.chem].empty * 1.03;
  const Ihover = h.P / h.V;
  const Ipeak = Pmax / Vsag;
  const rpmHover = 60 * Math.sqrt(h.T / (CT * h.rho * Math.pow(D, 4)));
  const rpmMax = 60 * Math.sqrt(Tmax / (CT * h.rho * Math.pow(D, 4)));
  const kvNeed = rpmMax / (Vsag * 0.82);
  const motors = pickMotor(prop, i.cells, kvNeed);
  const motor = motors[0]!;

  // Thrust actually available with the chosen winding, and the hover throttle that gives.
  const rpmAvail = motor.kv * Vsag * 0.82;
  const TAvail = Tmax * Math.pow(rpmAvail / rpmMax, 2);
  const hoverFrac = Math.min(1, h.T / TAvail);
  const expo = prop >= 20 ? 0.75 : prop >= 10 ? 0.65 : 0.55;
  const hoverThrottle = (-(1 - expo) + Math.sqrt(Math.pow(1 - expo, 2) + 4 * expo * hoverFrac)) / (2 * expo);

  const escAmps = CONT_AMPS.find((a) => a >= Ipeak * 1.1) ?? CONT_AMPS.at(-1)!;
  const escCells = i.cells <= 6 ? "6" : i.cells <= 12 ? "12" : i.cells <= 14 ? "14" : "24";
  const big = escAmps >= 80;
  const esc: EscConfig = {
    ...ESC_DEFAULT,
    layout: i.rotors === 4 && escAmps <= 60 && prop <= 13 ? "4" : "1",
    amps: escAmps,
    cells: escCells,
    control: prop >= 15 ? "FOC" : "BEMF",
    protocol: big ? "CAN" : "DS600",
    firmware: big ? "MKR" : "AM32",
    telemetry: big ? "FULL" : "BASIC",
    mount: i.rotors === 4 && escAmps <= 60 && prop <= 13 ? "30" : "ARM",
    cooling: big ? "SINK" : "BARE",
    protection: "COAT",
    powerAwg: Math.max(8, Math.min(16, awgFor(Ipeak))),
    powerConn: Ipeak > 60 ? "AS150" : Ipeak > 40 ? "XT90" : "XT60",
    signalConn: big ? "CANGH" : "JSTGH",
    hover: Math.round(Ihover),
    peak: Math.round(Ipeak),
    qty: i.rotors,
  };

  const propCfg: PropConfig = { ...propDefaults(prop), rpm: Math.round(rpmMax / 100) * 100, qty: i.rotors };
  const tip = tipSpeed(propCfg);
  const cRate = (Ipeak * i.rotors) / (i.capacity / 1000);
  const discLoad = h.T / G / h.A;

  const warnings: Warning[] = [];
  if (hoverFrac > 0.65) warnings.push({ level: "stop", text: `Hover needs ${Math.round(hoverFrac * 100)}% of the thrust available. Keep it under 60%: lighten the aircraft, add rotors or use bigger propellers.` });
  else if (hoverFrac > 0.55) warnings.push({ level: "warn", text: `Hover needs ${Math.round(hoverFrac * 100)}% of the thrust available. Little margin for wind or a motor failure.` });
  if (tip.mach > 0.7) warnings.push({ level: "stop", text: `Tip speed is Mach ${tip.mach} at full power. Above 0.7 the propeller loses efficiency and gets loud: use more cells and a lower KV, or a smaller propeller.` });
  else if (tip.mach > 0.6) warnings.push({ level: "warn", text: `Tip speed is Mach ${tip.mach} at full power: noisy. Fine for short climbs.` });
  if (cRate > CHEM[i.chem].maxC) warnings.push({ level: "stop", text: `Peak draw is ${cRate.toFixed(1)}C, above the ${CHEM[i.chem].maxC}C a ${CHEM[i.chem].label} pack usually handles. Use a bigger pack or LiPo.` });
  if (i.rotors === 4 && i.payload > 5) warnings.push({ level: "warn", text: "A quadcopter cannot survive a motor failure. With this payload, six or eight rotors give you a way down." });
  if (!motor.standard) warnings.push({ level: "warn", text: `No standard winding is close to ${Math.round(kvNeed)} KV for this propeller and battery, so the motor is a custom winding. Makers do this; allow extra lead time.` });
  if (h.rho < 1.1) warnings.push({ level: "warn", text: `Air at ${i.altitude} m and ${i.temp} °C is ${Math.round((1 - h.rho / 1.225) * 100)}% thinner than sea level. Every figure here already allows for it; datasheet thrust does not.` });

  return {
    input: i,
    rho: h.rho,
    mass: h.mass,
    battery: batteryKg(i),
    prop,
    thrustPerRotorKg: h.T / G,
    maxThrustPerRotorKg: Tmax / G,
    hoverW: h.P,
    peakW: Pmax,
    Ihover,
    Ipeak,
    Itotal: h.I,
    minutes: h.minutes,
    rpmHover,
    rpmMax,
    kvNeed,
    motors,
    motor,
    hoverFrac,
    hoverThrottle,
    expo,
    esc,
    propCfg,
    tip,
    cRate,
    discLoad,
    leadAwg: awgFor(Ipeak),
    warnings,
    codes: {
      motor: `TM-MOT-${motor.size}-${motor.kv}-A`,
      esc: escCode(esc),
      prop: propCode(propCfg),
    },
    links: {
      motor: `/configure/motor?f=${motor.size}&kv=${motor.kv}&v=${CELL_VOLTS[motor.cells] ? motor.cells : "12S"}&q=${i.rotors}`,
      esc: `/configure/esc?${escToParams(esc)}`,
      prop: `/configure/propeller?${propToParams(propCfg)}`,
    },
  };
}

/** Flight time against battery size, with the battery's own weight counted. */
export function timeCurve(i: SizingInput) {
  const pts: { capacity: number; minutes: number }[] = [];
  for (let f = 0.25; f <= 3.001; f += 0.125) {
    const capacity = Math.round((i.capacity * f) / 500) * 500;
    pts.push({ capacity, minutes: hover(i, capacity).minutes });
  }
  return pts;
}

const nums: (keyof SizingInput)[] = ["dry", "payload", "rotors", "maxProp", "cells", "capacity", "twr", "altitude", "temp", "avionics"];

export function sizingToParams(i: SizingInput) {
  return new URLSearchParams([...nums.map((k) => [k, String(i[k])] as [string, string]), ["coax", i.coax ? "1" : "0"], ["chem", i.chem]]).toString();
}

export function sizingFromParams(sp: URLSearchParams): SizingInput {
  const d = SIZING_DEFAULT;
  const n = (k: keyof SizingInput, min: number, max: number) => {
    const v = Number(sp.get(k));
    return sp.get(k) !== null && Number.isFinite(v) && v >= min && v <= max ? v : (d[k] as number);
  };
  return {
    dry: n("dry", 0.1, 500),
    payload: n("payload", 0, 500),
    rotors: ROTOR_CHOICES.includes(n("rotors", 3, 16)) ? n("rotors", 3, 16) : d.rotors,
    coax: sp.get("coax") === "1",
    maxProp: n("maxProp", 3, 60),
    cells: CELL_CHOICES.includes(n("cells", 1, 30)) ? n("cells", 1, 30) : d.cells,
    capacity: n("capacity", 300, 200000),
    chem: sp.get("chem") === "LIPO" ? "LIPO" : sp.get("chem") === "LIION" ? "LIION" : d.chem,
    twr: n("twr", 1.2, 5),
    altitude: n("altitude", -100, 6000),
    temp: n("temp", -30, 55),
    avionics: n("avionics", 0, 5000),
  };
}
