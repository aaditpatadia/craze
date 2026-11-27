"use client";

import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { SITE } from "@/lib/config";
import { SOURCE_LABEL, mcuMaker, readHash, recordFlags, recordHash, recordId, type FwRecord } from "@/lib/firmware";
import { SEAL_LABEL, checkSeal, type SealState } from "./FirmwareTool";

/** A firmware origin record on a Timule blueprint, to file with the batch paperwork. */
export function FirmwareRecordSheet() {
  const [r, setR] = useState<FwRecord | null>(null);
  const [seal, setSeal] = useState<string | null>(null);
  const [state, setState] = useState<SealState>("none");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const h = readHash(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the record link once after mount
    setR(h.record);
    setSeal(h.seal);
    setReady(true);
    if (h.record && h.seal) {
      setState("checking");
      void checkSeal(h.record, h.seal).then(setState);
    }
  }, []);
  const host = SITE.url.replace(/^https?:\/\//, "");
  const id = r ? recordId(r) : "TMF";
  const m = r ? mcuMaker(r.mcuMaker) : undefined;
  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: r ? `/tools/firmware${recordHash(r, seal)}` : "/tools/firmware", label: "Firmware records" }} fileName={`${id} Timule firmware record`} />}>
      <BlueprintSheet
        kind="Firmware origin record"
        title={r ? `${r.firmware} ${r.version} on ${r.part}` : "Firmware origin record"}
        number={id}
        status={state === "valid" ? "Sealed" : state === "invalid" ? "Seal broken" : "Declared"}
        fields={[
          { label: "Document", value: "Firmware record" },
          { label: "Part", value: r?.part ?? "", mono: true },
          { label: "Batch", value: r?.batch ?? "", mono: true },
          { label: "Units", value: r ? String(r.units) : "" },
          { label: "Firmware", value: r ? `${r.firmware} ${r.version}` : "" },
          { label: "Chip", value: r?.mcu ?? "" },
          { label: "Flashed", value: r?.flashed ?? "" },
          { label: "Seal", value: state === "valid" ? "Timule" : "None" },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        {ready && !r ? <p className="bp-faint mt-4">No record in this link. Open the sheet from a record link.</p> : null}
        {r ? (
          <>
            <BpSection n="01" title="Fingerprint">
              <div className="bp-box mt-2">
                <span className="bp-label">SHA-256 of {r.fileName}, {r.bytes.toLocaleString("en-IN")} bytes</span>
                <p className="bp-mono bp-accent mt-1 break-all text-[10pt] font-semibold">{r.sha256.replace(/(.{16})/g, "$1 ").trim()}</p>
                <p className="bp-dim mt-2 text-[8pt]">{SEAL_LABEL[state]}.</p>
              </div>
            </BpSection>
            <BpSection n="02" title="Record">
              <table className="bp-table">
                <tbody>
                  {[
                    ["Part code", r.part],
                    ["Batch and units", `${r.batch || "Not given"}, ${r.units} units`],
                    ["Firmware", `${r.firmware} ${r.version}`],
                    ["Source", `${SOURCE_LABEL[r.source]}${r.sourceRef ? `: ${r.sourceRef}` : ""}`],
                    ["Licence", r.licence || "Not given"],
                    ["Built and flashed by", `${r.builtBy || "Not given"}${r.flashed ? `, ${r.flashed}` : ""}`],
                    ["Chip", `${r.mcu || "Not given"}${m && m.id !== "OT" ? `, ${m.maker}, ${m.country}` : ""}`],
                    ["Notes", r.notes || ""],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="bp-dim w-[45mm]">{k}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </BpSection>
            <BpSection n="03" title="Points to review">
              <ul className="bp-list bp-dim mt-1">
                {recordFlags(r).map((f) => (
                  <li key={f}>{f}</li>
                ))}
                <li>To check a unit: read its firmware back, open the record link at {host}/tools/firmware and drop the file. The fingerprints must match exactly.</li>
              </ul>
            </BpSection>
            <p className="bp-faint mt-6 text-[7pt]">
              A Timule seal means we read back a unit from this batch, matched its fingerprint, and checked the chip and source declared above. The seal covers every field on this
              record: changing any of them breaks it.
            </p>
          </>
        ) : null}
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
