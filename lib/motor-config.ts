import { EVIDENCE, ORIGIN, o, type Option } from "./config-options";
export { EVIDENCE, ORIGIN };
export type { Option };
/**
 * BLDC motor configurator: standard frames and every option a buyer can specify.
 * Frames are industry-standard stator sizes with the KV windings Indian makers offer
 * today. Only geometry and electrical designations are listed here, never a maker's
 * measured thrust or efficiency: those are their claims until we check them.
 * Plain TypeScript so the client and the print sheet share it.
 */

export type Use = "multirotor" | "vtol" | "fixed-wing" | "fpv";
export type KvOption = { kv: number; cells: string };
export type Frame = {
  /** Stator diameter then height in mm, as written on the motor: 6015 = 60 x 15 mm. */
  size: string;
  kvs: KvOption[];
  props: string;
  uses: Use[];
  /** Part page if this frame is already a listed TM part. */
  partId?: string;
};

export const USE_LABEL: Record<Use, string> = {
  multirotor: "Multirotor",
  vtol: "VTOL lift",
  "fixed-wing": "Fixed-wing cruise",
  fpv: "FPV and interceptor",
};

const k = (kv: number, cells: string): KvOption => ({ kv, cells });

export const FRAMES: Frame[] = [
  { size: "2306", kvs: [k(1750, "4-6S")], props: '5"', uses: ["fpv"] },
  { size: "2806", kvs: [k(1300, "4-6S"), k(1700, "4-6S")], props: '7-8"', uses: ["fpv", "multirotor"] },
  { size: "2807", kvs: [k(1300, "6S")], props: '7"', uses: ["fpv", "multirotor"], partId: "tm-mot-2807-1300" },
  { size: "3115", kvs: [k(900, "6S")], props: '7-10"', uses: ["fpv", "multirotor"] },
  { size: "3510", kvs: [k(700, "6S")], props: '12-14"', uses: ["multirotor"] },
  { size: "3515", kvs: [k(400, "6S"), k(880, "6S")], props: '12-14"', uses: ["multirotor"] },
  { size: "4006", kvs: [k(380, "6S"), k(400, "6S"), k(440, "6S")], props: '13-16"', uses: ["multirotor"] },
  { size: "4015", kvs: [k(340, "6S"), k(510, "6S")], props: '14-18"', uses: ["multirotor", "fpv"] },
  { size: "4114", kvs: [k(400, "6-12S")], props: '15-18"', uses: ["multirotor"], partId: "tm-mot-4114-400" },
  { size: "4130", kvs: [k(230, "12S"), k(300, "12S")], props: '14-18"', uses: ["fixed-wing"] },
  { size: "5004", kvs: [k(500, "4-6S")], props: '18"', uses: ["multirotor"] },
  { size: "5215", kvs: [k(420, "6S"), k(480, "6S")], props: '14-16"', uses: ["multirotor", "fixed-wing"] },
  { size: "5345", kvs: [k(180, "12S"), k(210, "12S")], props: '18-22"', uses: ["fixed-wing"] },
  { size: "6008", kvs: [k(160, "12S"), k(340, "6S")], props: '20-23"', uses: ["multirotor"] },
  { size: "6010", kvs: [k(160, "12S")], props: '20-22"', uses: ["multirotor"] },
  { size: "6015", kvs: [k(150, "12S"), k(170, "12S"), k(340, "6S")], props: '22-24"', uses: ["multirotor"] },
  { size: "6020", kvs: [k(180, "12S")], props: '22-26"', uses: ["multirotor"] },
  { size: "6040", kvs: [k(160, "12S")], props: '28-30"', uses: ["fixed-wing"] },
  { size: "6215", kvs: [k(170, "12S")], props: '22-24"', uses: ["multirotor"], partId: "tm-mot-6215-170" },
  { size: "8008", kvs: [k(90, "12S"), k(110, "12S"), k(230, "6S")], props: '26-30"', uses: ["multirotor"] },
  { size: "8010", kvs: [k(120, "12S")], props: '26-30"', uses: ["vtol"] },
  { size: "8015", kvs: [k(100, "12S"), k(150, "12S")], props: '26-30"', uses: ["multirotor", "vtol"] },
  { size: "8020", kvs: [k(120, "12S")], props: '28-30"', uses: ["multirotor"] },
  { size: "8030", kvs: [k(160, "12S")], props: '24-27"', uses: ["fixed-wing"] },
  { size: "10005", kvs: [k(90, "12S")], props: '30-32"', uses: ["multirotor"] },
  { size: "10020", kvs: [k(150, "12S")], props: '30-34"', uses: ["multirotor"] },
  { size: "10025", kvs: [k(160, "12S")], props: '30-34"', uses: ["multirotor"] },
  { size: "14015", kvs: [k(80, "12-24S")], props: '40-48"', uses: ["multirotor"] },
];

export const frameDims = (size: string) => {
  const d = Number(size.length === 5 ? size.slice(0, 3) : size.slice(0, 2));
  const h = Number(size.length === 5 ? size.slice(3) : size.slice(2));
  return { d, h };
};



export const CELLS = [o("4S", "4S", "14.8 V nominal"), o("6S", "6S", "22.2 V nominal"), o("12S", "12S", "44.4 V nominal"), o("14S", "14S", "51.8 V nominal"), o("24S", "24S", "88.8 V nominal")];
export const CELL_VOLTS: Record<string, number> = { "4S": 14.8, "6S": 22.2, "12S": 44.4, "14S": 51.8, "24S": 88.8 };

export const SHAFT_DIA = [4, 5, 6, 8, 10, 12, 15, 20];
export const SHAFT_STYLE = [
  o("P", "Plain stick-out", "Propeller clamps to a hub on the bell. Most common on large motors."),
  o("T", "Threaded", "Propeller sits on the shaft and is held by a nut. Common on small motors."),
  o("H", "Hollow", "Wires or a cooling path run through the centre."),
  o("K", "Keyed", "A key stops the hub slipping under high torque."),
];

export type Pattern = { n: number; screw: string; pcd: number };
export const pat = (n: number, screw: string, pcd: number): Pattern => ({ n, screw, pcd });
export const patternLabel = (p: Pattern) => `${p.n} × ${p.screw} on ${p.pcd} mm circle`;
export const patternCode = (p: Pattern) => `${p.n}${p.screw}/${p.pcd}`;

export const PROP_MOUNTS: Pattern[] = [pat(4, "M2", 9), pat(4, "M3", 12), pat(4, "M3", 16), pat(4, "M4", 25), pat(6, "M4", 30), pat(6, "M5", 40), pat(8, "M5", 55)];
export const BASE_MOUNTS: Pattern[] = [pat(4, "M2", 12), pat(4, "M3", 16), pat(4, "M3", 19), pat(6, "M3", 19), pat(4, "M4", 25), pat(4, "M4", 30), pat(6, "M4", 40), pat(6, "M5", 60), pat(8, "M5", 90)];

export const BEARINGS = [
  o("2Z", "Shielded steel (2Z)", "Metal shields keep out coarse dirt. Lowest friction. Standard for clean, dry use."),
  o("RS", "Sealed steel (2RS)", "Rubber seals keep out dust and splashes. Slightly more drag. For farms, sand and rain."),
  o("HC", "Hybrid ceramic", "Ceramic balls run cooler and last longer at high speed. Costs more."),
];
export const MAGNETS = [
  o("N52H", "N52H", "Safe to 120 °C. Strongest per gram. For light loads and good airflow."),
  o("N52SH", "N52SH", "Safe to 150 °C. The usual choice for commercial drones."),
  o("N48UH", "N48UH", "Safe to 180 °C. For heavy lift, hot climates and sustained full power."),
];
export const MAGNET_TEMP: Record<string, number> = { N52H: 120, N52SH: 150, N48UH: 180 };
export const INSULATION = [
  o("F", "Class F", "Windings rated to 155 °C. Standard."),
  o("H", "Class H", "Windings rated to 180 °C. For continuous high current."),
];
export const INSULATION_TEMP: Record<string, number> = { F: 155, H: 180 };
export const PROTECTION = [
  o("IP00", "Open", "No coating. Fine for dry, clean air."),
  o("IP43", "IP43", "Coated stator and bearings shielded. Handles light rain and dust."),
  o("IP55", "IP55", "Coated stator, sealed bearings. Handles dust and water jets: spraying and marine work."),
];
export const LEAD_LENGTH = [100, 150, 200, 300, 500, 700];
export const LEAD_AWG = [20, 18, 16, 14, 12, 10, 8];
export const CONNECTORS = [o("BARE", "Bare tinned ends"), o("MR30", "MR30"), o("XT60", "XT60"), o("XT90", "XT90"), o("AS150", "AS150"), o("BULLET", "Bullet 4 / 5.5 mm")];
export const BALANCE = [
  o("G6.3", "Standard (G6.3)", "Normal balancing. Fine for most airframes."),
  o("G2.5", "Fine (G2.5)", "Tighter balance. Less vibration for cameras and long life."),
];

export type MotorConfig = {
  size: string;
  kv: number;
  cells: string;
  use: Use;
  shaftDia: number;
  shaftStyle: string;
  prop: Pattern;
  base: Pattern;
  bearing: string;
  magnet: string;
  insulation: string;
  protection: string;
  leadLength: number;
  leadAwg: number;
  connector: string;
  balance: string;
  origin: string;
  evidence: string;
  qty: number;
};

/** Sensible defaults for a frame, scaled by stator diameter. */
export function defaultsFor(size: string, kv?: number): MotorConfig {
  const frame = FRAMES.find((f) => f.size === size);
  const { d } = frameDims(size);
  const kvo = frame?.kvs.find((x) => x.kv === kv) ?? frame?.kvs[0];
  // "4-6S" defaults to 6S; "12-24S" defaults to 12S.
  const raw = kvo?.cells ?? "6S";
  const cells = raw.includes("-") ? (raw.endsWith("-6S") ? "6S" : `${raw.split("-")[0]}S`) : raw;
  const big = d >= 60;
  return {
    size,
    kv: kv ?? kvo?.kv ?? 400,
    cells: CELL_VOLTS[cells] ? cells : "6S",
    use: frame?.uses[0] ?? "multirotor",
    shaftDia: d <= 28 ? 5 : d <= 35 ? 6 : d <= 45 ? 8 : d <= 62 ? 12 : d <= 85 ? 15 : 20,
    shaftStyle: d <= 31 ? "T" : "P",
    prop: d <= 23 ? PROP_MOUNTS[1]! : d <= 31 ? PROP_MOUNTS[2]! : d <= 45 ? PROP_MOUNTS[3]! : d <= 62 ? PROP_MOUNTS[4]! : d <= 85 ? PROP_MOUNTS[5]! : PROP_MOUNTS[6]!,
    base: d <= 23 ? BASE_MOUNTS[1]! : d <= 31 ? BASE_MOUNTS[2]! : d <= 45 ? BASE_MOUNTS[4]! : d <= 62 ? BASE_MOUNTS[6]! : d <= 85 ? BASE_MOUNTS[7]! : BASE_MOUNTS[8]!,
    bearing: "2Z",
    magnet: big ? "N48UH" : "N52SH",
    insulation: big ? "H" : "F",
    protection: big ? "IP43" : "IP00",
    leadLength: d <= 31 ? 150 : d <= 62 ? 300 : 500,
    leadAwg: d <= 23 ? 20 : d <= 31 ? 18 : d <= 45 ? 16 : d <= 62 ? 12 : 10,
    connector: d <= 31 ? "BARE" : d <= 62 ? "BULLET" : "AS150",
    balance: "G6.3",
    origin: "O2",
    evidence: "T2",
    qty: 8,
  };
}

/** The part code: frame and KV. Same for every buyer of this frame and winding. */
export const motorCode = (c: Pick<MotorConfig, "size" | "kv">) => `TM-MOT-${c.size}-${c.kv}-A`;

/** The build string: every option in a short form a supplier reads off the purchase order. */
export function buildString(c: MotorConfig): string {
  return [
    c.cells,
    `S${c.shaftDia}${c.shaftStyle}`,
    `P${patternCode(c.prop)}`,
    `B${patternCode(c.base)}`,
    c.bearing,
    c.magnet,
    `INS-${c.insulation}`,
    c.protection,
    `L${c.leadLength}/${c.leadAwg}AWG/${c.connector}`,
    c.balance,
    c.origin,
    c.evidence,
  ].join(" · ");
}

const label = (list: Option[], id: string) => list.find((x) => x.id === id)?.label ?? id;

/** One line per option, for the request email and the printed spec. */
export function specLines(c: MotorConfig): [string, string][] {
  const frame = FRAMES.find((f) => f.size === c.size);
  const { d, h } = frameDims(c.size);
  const standard = frame?.kvs.some((x) => x.kv === c.kv);
  return [
    ["Stator", `${d} × ${h} mm (${c.size})${frame ? "" : ", custom frame"}`],
    ["KV", `${c.kv} rpm per volt${standard ? "" : ", custom winding"}`],
    ["Battery", `${c.cells}, ${CELL_VOLTS[c.cells]} V nominal`],
    ["No-load speed", `about ${Math.round(c.kv * (CELL_VOLTS[c.cells] ?? 0)).toLocaleString("en-IN")} rpm at nominal voltage`],
    ["Use", USE_LABEL[c.use]],
    ["Propeller range", frame?.props ?? "To be agreed"],
    ["Shaft", `${c.shaftDia} mm, ${label(SHAFT_STYLE, c.shaftStyle).toLowerCase()}`],
    ["Propeller mount", patternLabel(c.prop)],
    ["Base mount", patternLabel(c.base)],
    ["Bearings", label(BEARINGS, c.bearing)],
    ["Magnets", `${label(MAGNETS, c.magnet)}, to ${MAGNET_TEMP[c.magnet]} °C`],
    ["Winding insulation", `${label(INSULATION, c.insulation)}, to ${INSULATION_TEMP[c.insulation]} °C`],
    ["Protection", label(PROTECTION, c.protection)],
    ["Leads", `${c.leadLength} mm, ${c.leadAwg} AWG, ${label(CONNECTORS, c.connector)}`],
    ["Balance", label(BALANCE, c.balance)],
    ["Origin", label(ORIGIN, c.origin)],
    ["Evidence", label(EVIDENCE, c.evidence)],
    ["Quantity", String(c.qty)],
  ];
}

/** Compact URL form, so a configuration can be shared, reopened and printed. */
export function toParams(c: MotorConfig): string {
  const p = new URLSearchParams({
    f: c.size,
    kv: String(c.kv),
    v: c.cells,
    u: c.use,
    sd: String(c.shaftDia),
    ss: c.shaftStyle,
    pm: patternCode(c.prop),
    bm: patternCode(c.base),
    br: c.bearing,
    mg: c.magnet,
    in: c.insulation,
    ip: c.protection,
    ll: String(c.leadLength),
    lg: String(c.leadAwg),
    cn: c.connector,
    bl: c.balance,
    or: c.origin,
    ev: c.evidence,
    q: String(c.qty),
  });
  return p.toString();
}

const parsePattern = (s: string | null): Pattern | null => {
  const m = s?.match(/^(\d+)(M\d)\/(\d+)$/);
  return m ? pat(Number(m[1]), m[2]!, Number(m[3])) : null;
};
const pick = <T extends string>(v: string | null, ok: readonly T[] | Option[], fallback: T): T => {
  const ids = (ok as (T | Option)[]).map((x) => (typeof x === "string" ? x : x.id));
  return v && ids.includes(v) ? (v as T) : fallback;
};
const num = (v: string | null, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : fallback;
};

export function fromParams(sp: URLSearchParams): MotorConfig {
  const size = /^\d{4,5}$/.test(sp.get("f") ?? "") ? sp.get("f")! : "6015";
  const kv = num(sp.get("kv"), 20, 5000, NaN);
  const d = defaultsFor(size, Number.isNaN(kv) ? undefined : kv);
  return {
    size,
    kv: Number.isNaN(kv) ? d.kv : kv,
    cells: pick(sp.get("v"), CELLS, d.cells),
    use: pick(sp.get("u"), Object.keys(USE_LABEL) as Use[], d.use),
    shaftDia: num(sp.get("sd"), 2, 40, d.shaftDia),
    shaftStyle: pick(sp.get("ss"), SHAFT_STYLE, d.shaftStyle),
    prop: parsePattern(sp.get("pm")) ?? d.prop,
    base: parsePattern(sp.get("bm")) ?? d.base,
    bearing: pick(sp.get("br"), BEARINGS, d.bearing),
    magnet: pick(sp.get("mg"), MAGNETS, d.magnet),
    insulation: pick(sp.get("in"), INSULATION, d.insulation),
    protection: pick(sp.get("ip"), PROTECTION, d.protection),
    leadLength: num(sp.get("ll"), 30, 2000, d.leadLength),
    leadAwg: num(sp.get("lg"), 4, 30, d.leadAwg),
    connector: pick(sp.get("cn"), CONNECTORS, d.connector),
    balance: pick(sp.get("bl"), BALANCE, d.balance),
    origin: pick(sp.get("or"), ORIGIN, d.origin),
    evidence: pick(sp.get("ev"), EVIDENCE, d.evidence),
    qty: num(sp.get("q"), 1, 1_000_000, d.qty),
  };
}
