/**
 * Firmware origin records. A record ties one firmware file, by its SHA-256 fingerprint, to a
 * TM part, a batch, the chip it runs on and where the code came from. The record lives in its
 * own link, so nothing is stored on our side. A maker can declare one; Timule seals it after
 * checking, with an HMAC only our server can make. Anyone can then check a file against it.
 */

export type FwRecord = {
  v: 1;
  part: string;
  batch: string;
  units: number;
  firmware: string;
  version: string;
  source: "open" | "maker" | "timule";
  sourceRef: string;
  licence: string;
  builtBy: string;
  mcu: string;
  mcuMaker: string;
  flashed: string;
  fileName: string;
  bytes: number;
  sha256: string;
  notes: string;
};

export const SOURCE_LABEL: Record<FwRecord["source"], string> = {
  open: "Open source, built from a named commit",
  maker: "Maker's own code",
  timule: "Built by Timule",
};

/** Chip families common on drone ESCs and flight controllers, with the company's home country. */
export const MCU_MAKERS: { id: string; families: string; maker: string; country: string }[] = [
  { id: "ST", families: "STM32", maker: "STMicroelectronics", country: "Switzerland" },
  { id: "SL", families: "EFM8, C8051 (BLHeli_S boards)", maker: "Silicon Labs", country: "United States" },
  { id: "AT", families: "AT32", maker: "Artery Technology", country: "China" },
  { id: "GD", families: "GD32", maker: "GigaDevice", country: "China" },
  { id: "GH", families: "APM32", maker: "Geehy Semiconductor", country: "China" },
  { id: "ES", families: "ESP32", maker: "Espressif", country: "China" },
  { id: "NX", families: "i.MX RT, Kinetis, LPC", maker: "NXP", country: "Netherlands" },
  { id: "MC", families: "SAM, dsPIC, PIC32", maker: "Microchip", country: "United States" },
  { id: "TI", families: "C2000, MSP430, Tiva", maker: "Texas Instruments", country: "United States" },
  { id: "IF", families: "XMC, AURIX", maker: "Infineon", country: "Germany" },
  { id: "RE", families: "RA, RX", maker: "Renesas", country: "Japan" },
  { id: "NU", families: "NuMicro", maker: "Nuvoton", country: "Taiwan" },
  { id: "RP", families: "RP2040, RP2350", maker: "Raspberry Pi", country: "United Kingdom" },
  { id: "SH", families: "SHAKTI", maker: "IIT Madras", country: "India" },
  { id: "CD", families: "VEGA, THEJAS32", maker: "C-DAC", country: "India" },
  { id: "OT", families: "Other", maker: "Other", country: "" },
];

export const mcuMaker = (id: string) => MCU_MAKERS.find((m) => m.id === id);

export const recordId = (r: Pick<FwRecord, "sha256">) => `TMF-${r.sha256.slice(0, 10).toUpperCase()}`;

/** Same bytes for the same record on browser and server, whatever order the fields were set in. */
export function canonical(r: FwRecord): string {
  const keys = Object.keys(r).sort() as (keyof FwRecord)[];
  return JSON.stringify(keys.map((k) => [k, r[k]]));
}

const b64e = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64d = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export const encodeRecord = (r: FwRecord) => b64e(JSON.stringify(r));

export function decodeRecord(s: string): FwRecord | null {
  try {
    const r = JSON.parse(b64d(s)) as FwRecord;
    return validRecord(r) ? r : null;
  } catch {
    return null;
  }
}

export function validRecord(r: unknown): r is FwRecord {
  const x = r as FwRecord;
  return (
    !!x &&
    x.v === 1 &&
    typeof x.part === "string" &&
    /^[0-9a-f]{64}$/.test(x.sha256) &&
    typeof x.bytes === "number" &&
    ["open", "maker", "timule"].includes(x.source) &&
    [x.batch, x.firmware, x.version, x.sourceRef, x.licence, x.builtBy, x.mcu, x.mcuMaker, x.flashed, x.fileName, x.notes].every((v) => typeof v === "string" && v.length <= 400)
  );
}

/** Link fragment: r is the record, s the Timule seal when there is one. Fragments never reach a server log. */
export const recordHash = (r: FwRecord, seal?: string | null) => `#r=${encodeRecord(r)}${seal ? `&s=${seal}` : ""}`;

export function readHash(hash: string): { record: FwRecord | null; seal: string | null } {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const r = p.get("r");
  return { record: r ? decodeRecord(r) : null, seal: p.get("s") };
}

export async function sha256File(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const MAX_FIRMWARE_BYTES = 64 * 1024 * 1024;

export const EMPTY_RECORD: FwRecord = {
  v: 1,
  part: "",
  batch: "",
  units: 1,
  firmware: "AM32",
  version: "",
  source: "open",
  sourceRef: "",
  licence: "GPL-3.0",
  builtBy: "",
  mcu: "",
  mcuMaker: "ST",
  flashed: "",
  fileName: "",
  bytes: 0,
  sha256: "",
  notes: "",
};

/** Plain-language points a reviewer would raise about a record. */
export function recordFlags(r: FwRecord): string[] {
  const f: string[] = [];
  const m = mcuMaker(r.mcuMaker);
  if (m?.country === "China") f.push(`The chip is from ${m.maker}, a Chinese company. Buyers asking for no Chinese components will count it.`);
  if (m && m.country !== "India" && m.country !== "China" && m.id !== "OT") f.push(`The chip is from ${m.maker} (${m.country}). Not Chinese, but not Indian: declare it.`);
  if (r.source === "maker" && !r.sourceRef) f.push("The maker's own code with no source reference. Ask for the source, an escrow copy or a licence.");
  if (r.source === "open" && !/[0-9a-f]{7,40}/i.test(r.sourceRef)) f.push("Open-source firmware should name the exact commit it was built from, so the build can be repeated.");
  if (!r.batch) f.push("No batch number: the record cannot be tied to units on a shelf.");
  return f;
}
