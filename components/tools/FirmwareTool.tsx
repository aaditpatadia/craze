"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { FIRMWARE } from "@/lib/esc-config";
import {
  EMPTY_RECORD,
  MAX_FIRMWARE_BYTES,
  MCU_MAKERS,
  SOURCE_LABEL,
  mcuMaker,
  readHash,
  recordFlags,
  recordHash,
  recordId,
  sha256File,
  type FwRecord,
} from "@/lib/firmware";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { off, on, pill } from "@/components/configure/ui";

const input = "h-10 w-full rounded-lg border border-line bg-bg-elev px-3 text-sm text-fg";

export type SealState = "none" | "checking" | "valid" | "invalid" | "unconfigured";

export async function checkSeal(record: FwRecord, seal: string | null): Promise<SealState> {
  if (!seal) return "none";
  try {
    const res = await fetch("/api/firmware", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "verify", record, seal }) });
    const j = (await res.json()) as { configured?: boolean; valid?: boolean };
    return j.configured === false ? "unconfigured" : j.valid ? "valid" : "invalid";
  } catch {
    return "invalid";
  }
}

export const SEAL_LABEL: Record<SealState, string> = {
  none: "Declared by the maker, not yet sealed by Timule",
  checking: "Checking the Timule seal",
  valid: "Sealed by Timule: checked, and unchanged since",
  invalid: "Seal does not match: the record was changed or the seal is not ours",
  unconfigured: "Seal cannot be checked on this site yet",
};

function FileDrop({ onFile, label, busy }: { onFile: (f: File) => void; label: string; busy: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={cn("flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center", drag ? "border-accent bg-accent-soft" : "border-line-strong")}
    >
      <Icon name="upload" size={22} className="text-fg-subtle" />
      <p className="mt-2 text-sm text-fg-muted">{busy ? "Fingerprinting…" : label}</p>
      <p className="mt-1 text-xs text-fg-subtle">.bin, .hex, .elf up to 64 MB. Read in your browser; the file is never uploaded.</p>
      <input ref={ref} type="file" className="sr-only" aria-label={label} onChange={(e) => (e.target.files?.[0] ? onFile(e.target.files[0]) : null, (e.target.value = ""))} />
      <Button variant="secondary" className="mt-3" onClick={() => ref.current?.click()}>
        Choose file
      </Button>
    </div>
  );
}

export function FirmwareTool() {
  const [mode, setMode] = useState<"check" | "make">("check");
  const [record, setRecord] = useState<FwRecord | null>(null);
  const [seal, setSeal] = useState<string | null>(null);
  const [sealState, setSealState] = useState<SealState>("none");

  useEffect(() => {
    const h = readHash(window.location.hash);
    if (h.record) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the record link once after mount
      setRecord(h.record);
      setSeal(h.seal);
      setSealState(h.seal ? "checking" : "none");
      void checkSeal(h.record, h.seal).then(setSealState);
    } else if (window.location.search.includes("make")) setMode("make");
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "check"} onClick={() => setMode("check")} className={cn(pill, mode === "check" ? on : off)}>
          Check a firmware file
        </button>
        <button type="button" role="tab" aria-selected={mode === "make"} onClick={() => setMode("make")} className={cn(pill, mode === "make" ? on : off)}>
          Make a record (makers)
        </button>
      </div>
      {mode === "check" ? <Check record={record} seal={seal} sealState={sealState} /> : <Make />}
    </div>
  );
}

function Check({ record, seal, sealState }: { record: FwRecord | null; seal: string | null; sealState: SealState }) {
  const [hash, setHash] = useState<{ name: string; bytes: number; sha: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const take = async (f: File) => {
    setErr(null);
    if (f.size > MAX_FIRMWARE_BYTES) return setErr("That file is over 64 MB.");
    setBusy(true);
    setHash({ name: f.name, bytes: f.size, sha: await sha256File(f) });
    setBusy(false);
  };
  const match = record && hash ? hash.sha === record.sha256 : null;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        {record ? (
          <RecordCard record={record} seal={seal} sealState={sealState} />
        ) : (
          <div className="rounded-xl border border-line p-5 text-sm text-fg-muted">
            <p className="font-medium text-fg">Open a record link first</p>
            <p className="mt-2">
              Every Timule part with firmware ships with a record link or a record sheet. Open the link and this page loads it. Without one you can still fingerprint a file
              and compare it by eye with the SHA-256 printed on the sheet.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <FileDrop onFile={take} label="Drop the firmware read from the part, or the file you were given" busy={busy} />
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        {hash ? (
          <div className={cn("rounded-xl border p-5", match === false ? "border-danger/60" : "border-line")}>
            {match === null ? null : (
              <p className={cn("flex items-center gap-2 font-semibold", match ? "text-accent" : "text-danger")}>
                <Icon name={match ? "check" : "alert"} size={18} />
                {match ? "Match: this is the recorded firmware, byte for byte" : "No match: this file is not the recorded firmware"}
              </p>
            )}
            <p className="mt-2 text-xs text-fg-subtle">
              {hash.name} · {hash.bytes.toLocaleString("en-IN")} bytes
            </p>
            <p className="code-text mt-1 whitespace-normal break-all text-xs">SHA-256 {hash.sha}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RecordCard({ record: r, seal, sealState }: { record: FwRecord; seal: string | null; sealState: SealState }) {
  const m = mcuMaker(r.mcuMaker);
  const flags = recordFlags(r);
  return (
    <div className="rounded-xl border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="code-text text-lg font-semibold">{recordId(r)}</p>
          <p className="text-sm text-fg-muted">
            {r.firmware} {r.version} on <span className="code-text">{r.part || "no part code"}</span>
          </p>
        </div>
        <Link href={`/tools/firmware/record${recordHash(r, seal)}`} className={cn(pill, off)}>
          <Icon name="printer" size={14} /> Record sheet
        </Link>
      </div>
      <p className={cn("mt-3 flex items-center gap-2 text-sm", sealState === "valid" ? "text-accent" : sealState === "invalid" ? "text-danger" : "text-fg-muted")}>
        <Icon name={sealState === "valid" ? "check" : sealState === "invalid" ? "alert" : "info"} size={16} /> {SEAL_LABEL[sealState]}
      </p>
      <dl className="mt-4 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        {[
          ["Batch", `${r.batch || "not given"} · ${r.units} units`],
          ["Source", `${SOURCE_LABEL[r.source]}${r.sourceRef ? `: ${r.sourceRef}` : ""}`],
          ["Licence", r.licence || "not given"],
          ["Built and flashed", `${r.builtBy || "not given"}${r.flashed ? `, ${r.flashed}` : ""}`],
          ["Chip", `${r.mcu || "not given"}${m && m.id !== "OT" ? `, ${m.maker} (${m.country})` : ""}`],
          ["File", `${r.fileName} · ${r.bytes.toLocaleString("en-IN")} bytes`],
        ].map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-subtle">{k}</dt>
            <dd className="break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="code-text mt-3 whitespace-normal break-all text-xs text-fg-subtle">SHA-256 {r.sha256}</p>
      {flags.length ? (
        <ul className="mt-4 space-y-1.5 text-sm text-fg-muted">
          {flags.map((f) => (
            <li key={f} className="flex gap-2">
              <Icon name="alert" size={14} className="mt-1 shrink-0 text-danger" /> {f}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Make() {
  const [r, setR] = useState<FwRecord>(EMPTY_RECORD);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [seal, setSeal] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (p: Partial<FwRecord>) => {
    setR((x) => ({ ...x, ...p }));
    setSeal(null);
  };
  const take = async (f: File) => {
    setErr(null);
    if (f.size > MAX_FIRMWARE_BYTES) return setErr("That file is over 64 MB.");
    setBusy(true);
    const sha = await sha256File(f);
    set({ sha256: sha, fileName: f.name.slice(0, 200), bytes: f.size });
    setBusy(false);
  };
  const ready = r.sha256 && r.part && r.version;
  const link = ready ? `${window.location.origin}/tools/firmware${recordHash(r, seal)}` : "";
  const doSeal = async () => {
    setErr(null);
    const res = await fetch("/api/firmware", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "seal", record: r, key }) });
    const j = (await res.json()) as { seal?: string; error?: string };
    if (j.seal) setSeal(j.seal);
    else setErr(j.error ?? "Could not seal the record.");
  };
  const field = (label: string, k: keyof FwRecord, ph = "") => (
    <label className="block text-sm">
      <span className="text-fg-muted">{label}</span>
      <input className={cn(input, "mt-1")} value={String(r[k])} placeholder={ph} maxLength={400} onChange={(e) => set({ [k]: e.target.value } as Partial<FwRecord>)} />
    </label>
  );
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <FileDrop onFile={take} label={r.sha256 ? `Fingerprinted ${r.fileName}` : "Drop the firmware file you flash"} busy={busy} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("TM part code", "part", "TM-ESC-80-12S-A")}
          {field("Batch", "batch", "B2611-04")}
          <label className="block text-sm">
            <span className="text-fg-muted">Units in batch</span>
            <input type="number" min={1} className={cn(input, "mt-1")} value={r.units} onChange={(e) => set({ units: Math.max(1, Number(e.target.value) || 1) })} />
          </label>
          <label className="block text-sm">
            <span className="text-fg-muted">Firmware</span>
            <select className={cn(input, "mt-1")} value={r.firmware} onChange={(e) => set({ firmware: e.target.value })}>
              {[...FIRMWARE.map((x) => x.label), "PX4", "ArduPilot", "Betaflight", "Other"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {field("Version", "version", "2.18")}
          <label className="block text-sm">
            <span className="text-fg-muted">Where the code comes from</span>
            <select className={cn(input, "mt-1")} value={r.source} onChange={(e) => set({ source: e.target.value as FwRecord["source"] })}>
              {(Object.keys(SOURCE_LABEL) as FwRecord["source"][]).map((x) => (
                <option key={x} value={x}>
                  {SOURCE_LABEL[x]}
                </option>
              ))}
            </select>
          </label>
          {field(r.source === "open" ? "Repository and commit" : "Source reference or escrow", "sourceRef", "github.com/am32-firmware/AM32 @ 1a2b3c4")}
          {field("Licence", "licence", "GPL-3.0")}
          {field("Built and flashed by (TMS code)", "builtBy", "TMS-004")}
          <label className="block text-sm">
            <span className="text-fg-muted">Date flashed</span>
            <input type="date" className={cn(input, "mt-1")} value={r.flashed} onChange={(e) => set({ flashed: e.target.value })} />
          </label>
          {field("Chip part number", "mcu", "STM32G071CBU6")}
          <label className="block text-sm">
            <span className="text-fg-muted">Chip maker</span>
            <select className={cn(input, "mt-1")} value={r.mcuMaker} onChange={(e) => set({ mcuMaker: e.target.value })}>
              {MCU_MAKERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.maker}
                  {m.country ? ` (${m.country}) · ${m.families}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        {field("Notes", "notes", "Settings file, bootloader version, anything a reviewer needs")}
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </form>
      <div className="space-y-4">
        {r.sha256 ? (
          <RecordCard record={r} seal={seal} sealState={seal ? "valid" : "none"} />
        ) : (
          <p className="rounded-xl border border-line p-5 text-sm text-fg-muted">The record appears here once you drop the firmware file.</p>
        )}
        {ready ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(pill, on)}
              onClick={async () => {
                await navigator.clipboard.writeText(link).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Link copied" : "Copy record link"}
            </button>
            <Link href={`/tools/firmware/record${recordHash(r, seal)}`} className={cn(pill, off)}>
              <Icon name="printer" size={14} /> Record sheet (PDF)
            </Link>
          </div>
        ) : r.sha256 ? (
          <p className="text-sm text-fg-subtle">Add the part code and version to make the link.</p>
        ) : null}
        <div className="rounded-xl border border-line p-5 text-sm text-fg-muted">
          <p className="font-medium text-fg">Makers: how a record becomes sealed</p>
          <p className="mt-2">
            Send the record link with your batch. We read back a unit, compare its fingerprint, check the chip and source, then seal the record. A sealed record cannot be
            changed without breaking the seal, and anyone can check a file against it here.
          </p>
          {ready ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-fg-subtle">Timule staff: seal this record</summary>
              <div className="mt-2 flex gap-2">
                <input type="password" autoComplete="off" className={input} placeholder="Issuing key, or sign in first" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Issuing key" />
                <Button variant="secondary" onClick={doSeal}>
                  Seal
                </Button>
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
