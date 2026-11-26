/**
 * Propeller configurator: every option a buyer can specify for a drone propeller.
 * Plain TypeScript, shared by the configurator and its print sheet.
 */
import { EVIDENCE, ORIGIN, labelOf, o, pickId, pickNum, type Option } from "./config-options";
import { PROP_MOUNTS, patternCode, patternLabel, pat, type Pattern } from "./motor-config";

export const DIAMETERS = [5, 7, 10, 13, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 47];
export const BLADES = [o("2", "2 blades", "Most efficient. The usual choice for endurance."), o("3", "3 blades", "More thrust from a smaller disc and smoother, at some cost in efficiency.")];
export const STYLE = [
  o("FIX", "Fixed", "One rigid piece. Stiffest and cheapest."),
  o("FOLD", "Folding", "Blades fold back when stopped: smaller to carry and they give on a strike."),
];
export const MATERIAL = [
  o("GFN", "Glass-filled nylon", "Cheap and tough, but flexes under load. For small and training aircraft."),
  o("CFN", "Carbon-filled nylon", "Stiffer than glass nylon at a similar price. Good middle ground."),
  o("CFRP", "Carbon fibre (CFRP)", "Stiffest and lightest for its size. Holds its shape at high thrust."),
];
/** Relative stiffness and weight, for the comparison drawing only. */
export const MATERIAL_PROPS: Record<string, { stiff: number; weight: number }> = {
  GFN: { stiff: 0.35, weight: 0.9 },
  CFN: { stiff: 0.6, weight: 0.75 },
  CFRP: { stiff: 1, weight: 0.5 },
};
export const ROTATION = [
  o("CW", "Clockwise", "Seen from above. Half the motors on a multirotor spin each way."),
  o("CCW", "Counter-clockwise", "Seen from above."),
  o("PAIR", "Matched pairs", "One clockwise and one counter-clockwise, balanced as a set."),
];
export const HUB = [
  o("BORE", "Centre bore", "Propeller slides over the shaft and a nut or spinner holds it."),
  o("BOLT", "Bolt-on hub", "Propeller bolts to the motor bell with a screw pattern."),
];
export const BORES = [5, 6, 8, 10, 12, 15];
export const BALANCE = [o("G6.3", "Standard (G6.3)", "Normal balancing."), o("G2.5", "Fine (G2.5)", "Tighter balance, for cameras and long motor life.")];
export const FINISH = [o("PLAIN", "Plain"), o("TIPS", "High-visibility tips", "Coloured tips so ground crew can see the disc spinning.")];

export type PropConfig = {
  dia: number;
  pitch: number;
  blades: string;
  style: string;
  material: string;
  rotation: string;
  hub: string;
  bore: number;
  pattern: Pattern;
  balance: string;
  finish: string;
  rpm: number;
  origin: string;
  evidence: string;
  qty: number;
};

const defaultRpm = (dia: number) => Math.round(100000 / dia / 100) * 100;

export function propDefaults(dia = 24): PropConfig {
  return {
    dia,
    pitch: Math.round(dia * 0.33 * 2) / 2,
    blades: "2",
    style: dia >= 13 ? "FOLD" : "FIX",
    material: dia >= 10 ? "CFRP" : "GFN",
    rotation: "PAIR",
    hub: dia <= 10 ? "BORE" : "BOLT",
    bore: dia <= 7 ? 5 : dia <= 13 ? 6 : 8,
    pattern: dia <= 16 ? PROP_MOUNTS[3]! : dia <= 26 ? PROP_MOUNTS[4]! : dia <= 32 ? PROP_MOUNTS[5]! : PROP_MOUNTS[6]!,
    balance: "G6.3",
    finish: "PLAIN",
    rpm: defaultRpm(dia),
    origin: "O2",
    evidence: "T2",
    qty: 16,
  };
}

/** Pitch suggestions: about 0.25 to 0.5 of the diameter, the usual range for multirotors. */
export const pitchChoices = (dia: number) => [...new Set([0.25, 0.3, 0.33, 0.4, 0.5].map((r) => Math.round(dia * r * 2) / 2))];

const tok = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10)));

/** TM-PRP-2480-F2-A: diameter, pitch in tenths, F for folding, then blade count. */
export const propCode = (c: PropConfig) => `TM-PRP-${tok(c.dia)}${Math.round(c.pitch * 10)}-${c.style === "FOLD" ? "F" : ""}${c.blades}-A`;

export function tipSpeed(c: PropConfig) {
  const v = (Math.PI * c.dia * 0.0254 * c.rpm) / 60;
  return { ms: Math.round(v), mach: Math.round((v / 343) * 100) / 100 };
}

export const propBuild = (c: PropConfig) =>
  [c.material, c.rotation, c.hub === "BORE" ? `BORE${c.bore}` : `HUB${patternCode(c.pattern)}`, c.balance, c.finish, `RPM${c.rpm}`, c.origin, c.evidence].join(" · ");

export function propLines(c: PropConfig): [string, string][] {
  const t = tipSpeed(c);
  return [
    ["Diameter", `${c.dia} in (${Math.round(c.dia * 25.4)} mm)`],
    ["Pitch", `${c.pitch} in: advances ${c.pitch} in per turn with no slip`],
    ["Blades", labelOf(BLADES, c.blades)],
    ["Construction", labelOf(STYLE, c.style)],
    ["Material", labelOf(MATERIAL, c.material)],
    ["Rotation", labelOf(ROTATION, c.rotation)],
    ["Hub", c.hub === "BORE" ? `Centre bore ${c.bore} mm` : `Bolt-on, ${patternLabel(c.pattern)}`],
    ["Balance", labelOf(BALANCE, c.balance)],
    ["Finish", labelOf(FINISH, c.finish)],
    ["Design speed", `${c.rpm.toLocaleString("en-IN")} rpm maximum, tip speed ${t.ms} m/s (Mach ${t.mach})`],
    ["Origin", labelOf(ORIGIN, c.origin)],
    ["Evidence", labelOf(EVIDENCE, c.evidence)],
    ["Quantity", `${c.qty} propellers`],
  ];
}

export function propToParams(c: PropConfig): string {
  const { pattern, ...rest } = c;
  return new URLSearchParams([...Object.entries(rest).map(([k, v]) => [k, String(v)] as [string, string]), ["pattern", patternCode(pattern)]]).toString();
}

export function propFromParams(sp: URLSearchParams): PropConfig {
  const dia = pickNum(sp.get("dia"), 2, 80, 24, 0.1);
  const d = propDefaults(dia);
  const ids = (k: keyof PropConfig, list: Option[]) => pickId(sp.get(k), list, d[k] as string);
  const m = sp.get("pattern")?.match(/^(\d+)(M\d)\/(\d+)$/);
  return {
    dia,
    pitch: pickNum(sp.get("pitch"), 1, 40, d.pitch, 0.1),
    blades: ids("blades", BLADES),
    style: ids("style", STYLE),
    material: ids("material", MATERIAL),
    rotation: ids("rotation", ROTATION),
    hub: ids("hub", HUB),
    bore: pickNum(sp.get("bore"), 2, 30, d.bore),
    pattern: m ? pat(Number(m[1]), m[2]!, Number(m[3])) : d.pattern,
    balance: ids("balance", BALANCE),
    finish: ids("finish", FINISH),
    rpm: pickNum(sp.get("rpm"), 500, 60000, d.rpm),
    origin: ids("origin", ORIGIN),
    evidence: ids("evidence", EVIDENCE),
    qty: pickNum(sp.get("qty"), 1, 1_000_000, d.qty),
  };
}
