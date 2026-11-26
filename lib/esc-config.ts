/**
 * ESC configurator: every option a buyer can specify for an electronic speed controller.
 * Plain TypeScript, shared by the configurator and its print sheet.
 */
import { EVIDENCE, ORIGIN, labelOf, o, pickId, pickNum, type Option } from "./config-options";

export const LAYOUT = [
  o("1", "Single channel", "One ESC per motor, usually on the arm. Easier to cool and to replace."),
  o("4", "4-in-1 board", "Four ESCs on one board in the frame centre. Lighter wiring, one part to buy."),
];
export const CONT_AMPS = [20, 30, 40, 45, 60, 80, 100, 120, 150, 200];
export const CELLS = [
  o("6", "3-6S", "Up to 25.2 V. Small and mid-size multirotors."),
  o("12", "6-12S", "Up to 50.4 V. Heavy-lift and industrial."),
  o("14", "6-14S", "Up to 58.8 V. Heavy-lift with headroom."),
  o("24", "12-24S", "Up to 100.8 V. Very large multirotors and VTOL."),
];
export const CELL_MAX_V: Record<string, number> = { "6": 25.2, "12": 50.4, "14": 58.8, "24": 100.8 };
export const CONTROL = [
  o("BEMF", "Sensorless (BEMF)", "Reads the motor's back-voltage to time the switching. Standard for drones."),
  o("FOC", "Sensorless FOC", "Field-oriented control: smoother, quieter and more efficient at part throttle."),
  o("HALL", "Sensored (Hall)", "Uses sensors in the motor. Smooth from standstill: for robots and wheels."),
];
export const PROTOCOL = [
  o("PWM", "PWM", "Pulse width 1000 to 2000 µs. Universal, but slower and analogue."),
  o("DS300", "DShot300", "Digital throttle at 300 kbit/s. No calibration, error-checked."),
  o("DS600", "DShot600", "Digital throttle at 600 kbit/s. For fast flight controllers."),
  o("CAN", "DroneCAN", "Digital bus: one cable for all ESCs, with full telemetry back."),
];
export const FIRMWARE = [
  o("BLS", "BLHeli_S", "Open-source, widely used on 8-bit boards."),
  o("BJ", "Bluejay", "Open-source, based on BLHeli_S. DShot only."),
  o("AM32", "AM32", "Open-source, for 32-bit boards. Bidirectional DShot telemetry."),
  o("MKR", "Maker's own", "The maker's firmware, for FOC and CAN. Ask for the source or a licence."),
];
export const TELEMETRY = [
  o("NONE", "None"),
  o("BASIC", "RPM", "Motor speed back to the flight controller, for filtering vibration."),
  o("FULL", "Full", "Speed, voltage, current and temperature for logs and health checks."),
];
export const BEC = [
  o("NONE", "No BEC", "Power the flight controller from a separate converter."),
  o("5V2", "5 V, 2 A"),
  o("5V5", "5 V, 5 A"),
  o("12V", "12 V, 3 A", "For video transmitters and cameras."),
];
export const MOUNT = [
  o("20", "20 × 20 mm, M2", "Small 4-in-1 stacks."),
  o("30", "30.5 × 30.5 mm, M3", "The standard 4-in-1 stack."),
  o("45", "45 × 45 mm, M4", "Large 4-in-1 boards."),
  o("ARM", "Arm clamp", "Single ESC strapped or clamped to the arm in the propeller airflow."),
  o("PLATE", "Bolt-on base plate", "Single ESC on a metal plate that bolts to the frame and spreads heat."),
];
export const COOLING = [
  o("BARE", "Bare board", "Lightest. Needs airflow over it."),
  o("SINK", "Heatsink", "Aluminium fins. More headroom for long, high-current flights."),
  o("CASE", "Aluminium case", "Closed metal case that also acts as the heatsink."),
];
export const PROTECTION = [
  o("NONE", "None", "Bare electronics. Dry, clean air only."),
  o("COAT", "Conformal coating", "Thin protective film on the board. Handles damp and dust."),
  o("POT", "Potted, IP65", "Sealed in resin or a sealed case. Handles rain and spray."),
];
export const POWER_AWG = [16, 14, 12, 10, 8];
export const POWER_CONN = [o("PADS", "Solder pads"), o("XT60", "XT60"), o("XT90", "XT90"), o("AS150", "AS150"), o("RING", "Ring terminals")];
export const SIGNAL_CONN = [o("JSTSH", "JST-SH"), o("JSTGH", "JST-GH (locking)"), o("SERVO", "Servo plug"), o("CANGH", "CAN, JST-GH")];

export type EscConfig = {
  layout: string;
  amps: number;
  cells: string;
  control: string;
  protocol: string;
  firmware: string;
  telemetry: string;
  bec: string;
  mount: string;
  cooling: string;
  protection: string;
  powerAwg: number;
  powerConn: string;
  signalConn: string;
  hover: number;
  peak: number;
  origin: string;
  evidence: string;
  qty: number;
};

export const ESC_DEFAULT: EscConfig = {
  layout: "1",
  amps: 45,
  cells: "6",
  control: "BEMF",
  protocol: "DS600",
  firmware: "AM32",
  telemetry: "BASIC",
  bec: "NONE",
  mount: "ARM",
  cooling: "BARE",
  protection: "COAT",
  powerAwg: 12,
  powerConn: "XT60",
  signalConn: "JSTGH",
  hover: 12,
  peak: 35,
  origin: "O2",
  evidence: "T2",
  qty: 8,
};

/** Peak rating for 10 seconds, as most makers state it: about 1.5 times continuous. */
export const peakRating = (amps: number) => Math.round(amps * 1.5);

/** Part code: current, cells and layout. TM-ESC-45-6S-A, or TM-ESC-40X4-6S-A for a 4-in-1. */
export const escCode = (c: EscConfig) => `TM-ESC-${c.amps}${c.layout === "4" ? "X4" : ""}-${c.cells}S-A`;

export const escBuild = (c: EscConfig) =>
  [c.control, c.protocol, c.firmware, `TLM-${c.telemetry}`, `BEC-${c.bec}`, `MNT-${c.mount}`, c.cooling, c.protection, `PWR-${c.powerAwg}AWG/${c.powerConn}`, `SIG-${c.signalConn}`, c.origin, c.evidence].join(" · ");

/** How much of the rating the buyer's motor uses at hover and at peak. */
export function escFit(c: EscConfig) {
  const hoverPct = Math.round((c.hover / c.amps) * 100);
  const peakPct = Math.round((c.peak / peakRating(c.amps)) * 100);
  const verdict = hoverPct <= 80 && peakPct <= 90 ? "good" : hoverPct <= 100 && peakPct <= 100 ? "tight" : "over";
  return { hoverPct, peakPct, verdict } as const;
}

export function escLines(c: EscConfig): [string, string][] {
  const fit = escFit(c);
  return [
    ["Layout", labelOf(LAYOUT, c.layout)],
    ["Current", `${c.amps} A continuous, ${peakRating(c.amps)} A for 10 s, per channel`],
    ["Battery", `${labelOf(CELLS, c.cells)}, up to ${CELL_MAX_V[c.cells]} V`],
    ["Control", labelOf(CONTROL, c.control)],
    ["Throttle input", labelOf(PROTOCOL, c.protocol)],
    ["Firmware", labelOf(FIRMWARE, c.firmware)],
    ["Telemetry", labelOf(TELEMETRY, c.telemetry)],
    ["BEC", labelOf(BEC, c.bec)],
    ["Mounting", labelOf(MOUNT, c.mount)],
    ["Cooling", labelOf(COOLING, c.cooling)],
    ["Protection", labelOf(PROTECTION, c.protection)],
    ["Power leads", `${c.powerAwg} AWG, ${labelOf(POWER_CONN, c.powerConn)}`],
    ["Signal connector", labelOf(SIGNAL_CONN, c.signalConn)],
    ["Buyer's load", `${c.hover} A at hover (${fit.hoverPct}% of continuous), ${c.peak} A peak (${fit.peakPct}% of peak rating)`],
    ["Origin", labelOf(ORIGIN, c.origin)],
    ["Evidence", labelOf(EVIDENCE, c.evidence)],
    ["Quantity", String(c.qty)],
  ];
}

export function escToParams(c: EscConfig): string {
  return new URLSearchParams(Object.entries(c).map(([k, v]) => [k, String(v)])).toString();
}

export function escFromParams(sp: URLSearchParams): EscConfig {
  const d = ESC_DEFAULT;
  const ids = (k: keyof EscConfig, list: Option[]) => pickId(sp.get(k), list, d[k] as string);
  return {
    layout: ids("layout", LAYOUT),
    amps: pickNum(sp.get("amps"), 5, 400, d.amps),
    cells: ids("cells", CELLS),
    control: ids("control", CONTROL),
    protocol: ids("protocol", PROTOCOL),
    firmware: ids("firmware", FIRMWARE),
    telemetry: ids("telemetry", TELEMETRY),
    bec: ids("bec", BEC),
    mount: ids("mount", MOUNT),
    cooling: ids("cooling", COOLING),
    protection: ids("protection", PROTECTION),
    powerAwg: pickNum(sp.get("powerAwg"), 4, 24, d.powerAwg),
    powerConn: ids("powerConn", POWER_CONN),
    signalConn: ids("signalConn", SIGNAL_CONN),
    hover: pickNum(sp.get("hover"), 0, 400, d.hover),
    peak: pickNum(sp.get("peak"), 0, 600, d.peak),
    origin: ids("origin", ORIGIN),
    evidence: ids("evidence", EVIDENCE),
    qty: pickNum(sp.get("qty"), 1, 1_000_000, d.qty),
  };
}
