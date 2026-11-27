/**
 * Engineer downloads, generated in the browser from a configuration:
 *  - STL envelope models, for space claims and clearance checks in CAD;
 *  - DXF drilling drawings of every bolt pattern, at 1:1 in millimetres;
 *  - starting parameter files for ArduPilot and PX4 from a sizing result.
 * Envelopes are within about 2 mm of a typical part of the frame. They are not manufacturing models.
 */
import { frameDims, type MotorConfig, type Pattern } from "./motor-config";
import type { EscConfig } from "./esc-config";
import type { PropConfig } from "./prop-config";
import { CHEM, type SizingResult } from "./sizing";

/* ---------- STL ---------- */

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

function cylinder(r: number, z0: number, z1: number, seg = 64): Tri[] {
  const t: Tri[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const b = ((i + 1) / seg) * Math.PI * 2;
    const p0: V3 = [r * Math.cos(a), r * Math.sin(a), z0];
    const p1: V3 = [r * Math.cos(b), r * Math.sin(b), z0];
    const q0: V3 = [p0[0], p0[1], z1];
    const q1: V3 = [p1[0], p1[1], z1];
    t.push([p0, p1, q1], [p0, q1, q0], [[0, 0, z0], p1, p0], [[0, 0, z1], q0, q1]);
  }
  return t;
}

function box(x: number, y: number, z0: number, z1: number): Tri[] {
  const [a, b] = [x / 2, y / 2];
  const v = (i: number, j: number, k: number): V3 => [i ? a : -a, j ? b : -b, k ? z1 : z0];
  const q = (p: V3, r: V3, s: V3, u: V3): Tri[] => [
    [p, r, s],
    [p, s, u],
  ];
  return [
    ...q(v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0)),
    ...q(v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)),
    ...q(v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)),
    ...q(v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0)),
    ...q(v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)),
    ...q(v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)),
  ];
}

const f = (n: number) => n.toFixed(4);
function toStl(name: string, tris: Tri[]): string {
  const out = [`solid ${name}`];
  for (const [a, b, c] of tris) {
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    out.push(` facet normal ${f(n[0] / l)} ${f(n[1] / l)} ${f(n[2] / l)}`, "  outer loop", ...[a, b, c].map((p) => `   vertex ${f(p[0])} ${f(p[1])} ${f(p[2])}`), "  endloop", " endfacet");
  }
  out.push(`endsolid ${name}`);
  return out.join("\n");
}

/** Outside size of a motor of this stator, typical of the class. */
export function motorEnvelope(c: Pick<MotorConfig, "size" | "shaftDia">) {
  const { d, h } = frameDims(c.size);
  const od = Math.round(d * 1.18 + 3);
  const body = Math.round(h + 10 + d * 0.12);
  const shaft = Math.max(6, Math.round(c.shaftDia * 1.6));
  return { od, body, shaft, base: Math.round(od * 0.86) };
}

export function motorStl(c: MotorConfig): string {
  const e = motorEnvelope(c);
  return toStl(`TM-MOT-${c.size}-${c.kv}-A_envelope`, [...cylinder(e.base / 2, 0, 3), ...cylinder(e.od / 2, 3, e.body), ...cylinder(c.shaftDia / 2, e.body, e.body + e.shaft, 32)]);
}

export function escEnvelope(c: Pick<EscConfig, "layout" | "mount" | "amps" | "cooling">) {
  const four = c.layout === "4";
  const s = c.mount === "20" ? 20 : c.mount === "45" ? 45 : 30.5;
  const x = four ? Math.round(s + 8) : Math.round(40 + c.amps * 0.35);
  const y = four ? x : Math.round(22 + c.amps * 0.12);
  const z = c.cooling === "CASE" ? 18 : c.cooling === "SINK" ? 15 : four ? 7 : 9;
  return { x, y, z };
}

export function escStl(c: EscConfig, code: string): string {
  const e = escEnvelope(c);
  return toStl(`${code}_envelope`, box(e.x, e.y, 0, e.z));
}

/* ---------- DXF ---------- */

const CLEAR: Record<string, number> = { M2: 2.2, M3: 3.2, M4: 4.3, M5: 5.3, M6: 6.4 };

class Dxf {
  private e: string[] = [];
  circle(x: number, y: number, r: number, layer: string) {
    this.e.push("0", "CIRCLE", "8", layer, "10", f(x), "20", f(y), "30", "0", "40", f(r));
  }
  line(x1: number, y1: number, x2: number, y2: number, layer: string) {
    this.e.push("0", "LINE", "8", layer, "10", f(x1), "20", f(y1), "30", "0", "11", f(x2), "21", f(y2), "31", "0");
  }
  rect(x: number, y: number, w: number, h: number, layer: string) {
    this.line(x, y, x + w, y, layer);
    this.line(x + w, y, x + w, y + h, layer);
    this.line(x + w, y + h, x, y + h, layer);
    this.line(x, y + h, x, y, layer);
  }
  text(x: number, y: number, h: number, s: string, layer = "TEXT") {
    this.e.push("0", "TEXT", "8", layer, "10", f(x), "20", f(y), "30", "0", "40", f(h), "1", s.replace(/[^\x20-\x7e]/g, "x"));
  }
  cross(x: number, y: number, s: number) {
    this.line(x - s, y, x + s, y, "CENTER");
    this.line(x, y - s, x, y + s, "CENTER");
  }
  toString() {
    return ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "4", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES", ...this.e, "0", "ENDSEC", "0", "EOF"].join("\n");
  }
}

function pattern(d: Dxf, cx: number, cy: number, p: Pattern, label: string) {
  const r = p.pcd / 2;
  const start = p.n === 4 ? Math.PI / 4 : 0;
  d.circle(cx, cy, r, "CENTER");
  d.cross(cx, cy, r + 4);
  for (let i = 0; i < p.n; i++) {
    const a = start + (i / p.n) * Math.PI * 2;
    d.circle(cx + r * Math.cos(a), cy + r * Math.sin(a), (CLEAR[p.screw] ?? 3.2) / 2, "HOLES");
  }
  d.text(cx - r, cy - r - 8, 2.5, `${label}: ${p.n} x ${p.screw} on PCD ${p.pcd} mm, holes dia ${CLEAR[p.screw] ?? 3.2} clearance`);
}

export function motorDxf(c: MotorConfig, code: string): string {
  const e = motorEnvelope(c);
  const d = new Dxf();
  d.circle(0, 0, e.od / 2, "OUTLINE");
  pattern(d, 0, 0, c.base, "BASE MOUNT");
  d.circle(0, 0, c.shaftDia / 2 + 1, "OUTLINE");
  const x2 = e.od + 30;
  d.circle(x2, 0, e.od / 2, "OUTLINE");
  pattern(d, x2, 0, c.prop, "PROPELLER MOUNT");
  d.circle(x2, 0, c.shaftDia / 2, "OUTLINE");
  d.text(-e.od / 2, e.od / 2 + 12, 3.5, `${code}  TIMULE DRILLING DRAWING  1:1 mm`);
  d.text(-e.od / 2, e.od / 2 + 6, 2.5, `Envelope dia ${e.od} x ${e.body} mm body, shaft dia ${c.shaftDia} x ${e.shaft} mm. Typical of the class: confirm on the build sheet.`);
  return d.toString();
}

export function escDxf(c: EscConfig, code: string): string {
  const e = escEnvelope(c);
  const d = new Dxf();
  d.rect(-e.x / 2, -e.y / 2, e.x, e.y, "OUTLINE");
  d.cross(0, 0, Math.max(e.x, e.y) / 2 + 4);
  if (c.layout === "4" && ["20", "30", "45"].includes(c.mount)) {
    const s = c.mount === "20" ? 20 : c.mount === "45" ? 45 : 30.5;
    const screw = c.mount === "20" ? "M2" : c.mount === "45" ? "M4" : "M3";
    for (const [i, j] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      d.circle((i! * s) / 2, (j! * s) / 2, (CLEAR[screw] ?? 3.2) / 2, "HOLES");
    d.text(-e.x / 2, -e.y / 2 - 8, 2.5, `Stack mount ${s} x ${s} mm, ${screw}, holes dia ${CLEAR[screw]} clearance`);
  } else d.text(-e.x / 2, -e.y / 2 - 8, 2.5, c.mount === "PLATE" ? "Base plate: holes per the build sheet" : "Arm clamp: no holes in the frame");
  d.text(-e.x / 2, e.y / 2 + 10, 3.5, `${code}  TIMULE OUTLINE  1:1 mm`);
  d.text(-e.x / 2, e.y / 2 + 5, 2.5, `Envelope ${e.x} x ${e.y} x ${e.z} mm. Typical of the class: confirm on the build sheet.`);
  return d.toString();
}

export function propDxf(c: PropConfig, code: string): string {
  const d = new Dxf();
  const R = (c.dia * 25.4) / 2;
  d.circle(0, 0, R, "DISC");
  d.circle(0, 0, R + 0.1 * R, "CLEARANCE");
  d.cross(0, 0, R + 0.15 * R);
  if (c.hub === "BORE") {
    d.circle(0, 0, c.bore / 2, "HOLES");
    d.text(-R, -R - 14, 4, `Centre bore dia ${c.bore} mm`);
  } else pattern(d, 0, 0, c.pattern, "HUB");
  d.text(-R, R + 0.15 * R + 14, 6, `${code}  TIMULE PROPELLER DISC  1:1 mm`);
  d.text(-R, R + 0.15 * R + 6, 4, `Disc dia ${Math.round(R * 2)} mm. Outer ring: 10% tip clearance to frame and neighbours.`);
  return d.toString();
}

/* ---------- Flight software ---------- */

const poles = (size: string) => {
  const { d } = frameDims(size);
  return d <= 35 ? 14 : d < 60 ? 24 : 28;
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function ardupilotParams(r: SizingResult): string {
  const i = r.input;
  const chem = CHEM[i.chem];
  const frameClass = i.coax && i.rotors === 8 ? 4 : i.rotors === 4 ? 1 : i.rotors === 6 ? 2 : 3;
  const hover = Math.min(0.6875, Math.max(0.125, r3(r.hoverThrottle)));
  const notch = Math.max(20, Math.round(r.rpmHover / 60));
  const can = r.esc.protocol === "CAN";
  const dshot = r.esc.protocol.startsWith("DS");
  const tlm = r.esc.telemetry !== "NONE" && (can || dshot);
  const mask = (1 << i.rotors) - 1;
  const lines: [string, number | string, string][] = [
    ["FRAME_CLASS", frameClass, `${i.rotors} rotors${i.coax ? ", coaxial" : ""}`],
    ["FRAME_TYPE", 1, "X. Change to match your layout"],
    ["MOT_PWM_TYPE", can ? 0 : r.esc.protocol === "DS600" ? 6 : r.esc.protocol === "DS300" ? 5 : 0, can ? "ESCs on DroneCAN" : r.esc.protocol],
    ["MOT_BAT_VOLT_MAX", r3(i.cells * chem.full), `${i.cells}S full`],
    ["MOT_BAT_VOLT_MIN", r3(i.cells * chem.empty), `${i.cells}S empty under load`],
    ["MOT_THST_EXPO", r.expo, `${r.prop} in propellers`],
    ["MOT_THST_HOVER", hover, `Estimated. ArduPilot learns it in flight (MOT_HOVER_LEARN)`],
    ["MOT_HOVER_LEARN", 2, "Learn and save"],
    ["MOT_SPIN_ARM", 0.1, "CHECK on the bench"],
    ["MOT_SPIN_MIN", 0.15, "CHECK on the bench"],
    ["BATT_MONITOR", 4, "Analog voltage and current. Change for your power module"],
    ["BATT_CAPACITY", i.capacity, "mAh"],
    ["BATT_ARM_VOLT", r3(i.cells * (i.chem === "LIPO" ? 3.8 : 3.6)), "Refuse to arm below this"],
    ["BATT_LOW_VOLT", r3(i.cells * (chem.empty + 0.1)), "Return to launch"],
    ["BATT_CRT_VOLT", r3(i.cells * chem.empty), "Land"],
    ["BATT_FS_LOW_ACT", 2, "RTL"],
    ["BATT_FS_CRT_ACT", 1, "Land"],
    ["INS_HNTCH_ENABLE", 1, "Harmonic notch on the propeller frequency"],
    ["INS_HNTCH_MODE", tlm ? 3 : 1, tlm ? "Tracks ESC rpm telemetry" : "Tracks throttle"],
    ["INS_HNTCH_FREQ", notch, `Hz, hover rpm ${Math.round(r.rpmHover)} / 60`],
    ["INS_HNTCH_BW", Math.round(notch / 2), "Hz"],
    ["INS_HNTCH_REF", tlm ? 1 : hover, tlm ? "" : "Hover throttle"],
    ["SERVO_BLH_POLES", poles(r.motor.size), "CHECK: magnet poles on the motor datasheet"],
  ];
  if (dshot && tlm) lines.push(["SERVO_BLH_BDMASK", mask, "Bidirectional DShot on the motor outputs. CHECK output numbers"]);
  if (can) lines.push(["CAN_P1_DRIVER", 1, "First CAN driver"], ["CAN_D1_PROTOCOL", 1, "DroneCAN"], ["CAN_D1_UC_ESC_BM", mask, "ESCs on CAN. CHECK output numbers"]);
  return [
    `# Timule starting parameters for ArduPilot Copter`,
    `# ${r.codes.motor} / ${r.codes.esc} / ${r.codes.prop} on ${i.cells}S ${chem.label} ${i.capacity} mAh, ${r.mass.toFixed(1)} kg all-up`,
    `# Estimated from the Timule sizing tool for ${i.altitude} m and ${i.temp} C. Starting values only: review each line,`,
    `# bench-test with propellers off, and tune in flight. Lines marked CHECK depend on your hardware.`,
    `# Load in Mission Planner: Config > Full Parameter List > Load from file.`,
    "",
    ...lines.map(([k, v, c]) => `${k},${v}${c ? `\t# ${c}` : ""}`),
  ].join("\n");
}

export function px4Params(r: SizingResult): string {
  const i = r.input;
  const chem = CHEM[i.chem];
  const notch = Math.max(20, Math.round(r.rpmHover / 60));
  const can = r.esc.protocol === "CAN";
  const tlm = r.esc.telemetry !== "NONE" && r.esc.protocol.startsWith("DS");
  const p: [string, number, 6 | 9][] = [
    ["CA_AIRFRAME", 0, 6],
    ["CA_ROTOR_COUNT", i.rotors, 6],
    ["BAT1_N_CELLS", i.cells, 6],
    ["BAT1_CAPACITY", i.capacity, 9],
    ["BAT1_V_EMPTY", chem.empty, 9],
    ["BAT1_V_CHARGED", i.chem === "LIPO" ? 4.05 : 4.1, 9],
    ["MPC_THR_HOVER", r3(Math.min(0.8, Math.max(0.1, r.hoverFrac))), 9],
    ["THR_MDL_FAC", r.expo, 9],
    ["MOT_POLE_COUNT", poles(r.motor.size), 6],
  ];
  if (tlm) p.push(["DSHOT_BIDIR_EN", 1, 6], ["IMU_GYRO_DNF_EN", 1, 6], ["IMU_GYRO_DNF_MIN", Math.round(notch * 0.6), 9]);
  if (can) p.push(["UAVCAN_ENABLE", 3, 6]);
  return [
    `# Onboard parameters for Vehicle 1`,
    `# Timule starting parameters for PX4 multicopter`,
    `# ${r.codes.motor} / ${r.codes.esc} / ${r.codes.prop} on ${i.cells}S ${chem.label} ${i.capacity} mAh, ${r.mass.toFixed(1)} kg all-up`,
    `# Estimated for ${i.altitude} m and ${i.temp} C. Starting values only. Set the DShot or PWM output protocol in`,
    `# QGroundControl Actuators, check MOT_POLE_COUNT against the motor datasheet, and tune in flight.`,
    `# Load in QGroundControl: Vehicle Setup > Parameters > Tools > Load from file.`,
    "#",
    "# Vehicle-Id Component-Id Name Value Type",
    ...p.map(([k, v, t]) => `1\t1\t${k}\t${v}\t${t}`),
  ].join("\n");
}

export function sizingCsv(r: SizingResult, siteUrl: string): string {
  const i = r.input;
  const rows: [string, string | number][] = [
    ["TIMULE PROPULSION SIZING", ""],
    ["Prepared", new Date().toISOString().slice(0, 10)],
    ["Site", siteUrl.replace(/^https?:\/\//, "")],
    ["All-up mass kg", r.mass.toFixed(2)],
    ["Rotors", `${i.rotors}${i.coax ? " coaxial" : ""}`],
    ["Battery", `${i.cells}S ${CHEM[i.chem].label} ${i.capacity} mAh, ${r.battery.toFixed(2)} kg`],
    ["Air density kg/m3", r.rho.toFixed(3)],
    ["Hover thrust per rotor kg", r.thrustPerRotorKg.toFixed(2)],
    ["Max thrust per rotor kg", r.maxThrustPerRotorKg.toFixed(2)],
    ["Hover power per motor W", Math.round(r.hoverW)],
    ["Peak power per motor W", Math.round(r.peakW)],
    ["Hover current per motor A", r.Ihover.toFixed(1)],
    ["Peak current per motor A", r.Ipeak.toFixed(1)],
    ["Hover rpm", Math.round(r.rpmHover)],
    ["Max rpm", Math.round(r.rpmMax)],
    ["KV needed", Math.round(r.kvNeed)],
    ["Hover time min", r.minutes.toFixed(1)],
    ["Motor", r.codes.motor],
    ["ESC", r.codes.esc],
    ["Propeller", r.codes.prop],
  ];
  return rows.map(([k, v]) => `"${k}","${v}"`).join("\r\n") + `\r\n"Estimates within about 15%. Confirm on a thrust stand.",""`;
}

export function saveFile(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

