"use client";

import { useEffect, useState } from "react";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { SITE } from "@/lib/config";
import { CHEM, size, sizingFromParams, sizingToParams, type SizingInput } from "@/lib/sizing";
import { TimeCurve } from "./SizingTool";

const n1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-IN");
const n0 = (n: number) => Math.round(n).toLocaleString("en-IN");

/** A propulsion sizing on a Timule blueprint: the inputs, the matched set and every figure behind it. */
export function SizingSheet() {
  const [i, setI] = useState<SizingInput | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the sizing from the link once
    setI(sizingFromParams(new URLSearchParams(window.location.search)));
  }, []);
  if (!i) return <div className="bp-root min-h-dvh" data-variant="blueprint" />;
  const r = size(i);
  const today = new Date().toISOString().slice(0, 10);
  const number = `TM-SZ-${today.slice(2).replace(/-/g, "")}`;
  const host = SITE.url.replace(/^https?:\/\//, "");
  const rows: [string, string][] = [
    ["All-up mass", `${n1(r.mass)} kg: aircraft ${n1(i.dry)}, payload ${n1(i.payload)}, battery ${n1(r.battery)}`],
    ["Rotors", `${i.rotors}${i.coax ? ", coaxial" : ""}, ${r.prop} in propellers`],
    ["Battery", `${i.cells}S ${CHEM[i.chem].label}, ${n0(i.capacity)} mAh`],
    ["Conditions", `${n0(i.altitude)} m, ${i.temp} °C, air ${r.rho.toFixed(3)} kg/m³`],
    ["Thrust to weight", String(i.twr)],
    ["Hover, per motor", `${n1(r.thrustPerRotorKg)} kg, ${n0(r.hoverW)} W, ${n1(r.Ihover)} A, ${n0(r.rpmHover)} rpm`],
    ["Full power, per motor", `${n1(r.maxThrustPerRotorKg)} kg, ${n0(r.peakW)} W, ${n1(r.Ipeak)} A, ${n0(r.rpmMax)} rpm`],
    ["KV needed", `${n0(r.kvNeed)} rpm per volt`],
    ["Hover throttle", `${Math.round(r.hoverThrottle * 100)}% (${Math.round(r.hoverFrac * 100)}% of available thrust)`],
    ["Hover time", `${n1(r.minutes)} min, using ${CHEM[i.chem].usable * 100}% of the pack, ${n0(i.avionics)} W other loads`],
    ["Battery peak", `${n1(r.cRate)}C, ${n0(r.Ipeak * i.rotors)} A`],
    ["Tip speed", `${r.tip.ms} m/s, Mach ${r.tip.mach}`],
    ["Motor leads", `${r.leadAwg} AWG or heavier`],
  ];
  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: `/tools/sizing?${sizingToParams(i)}`, label: "Back to sizing" }} fileName={`${number} Timule propulsion sizing`} />}>
      <BlueprintSheet
        kind="Propulsion sizing"
        title={`${i.rotors}-rotor, ${n1(r.mass)} kg propulsion set`}
        number={number}
        status="Estimate"
        fields={[
          { label: "Document", value: "Propulsion sizing" },
          { label: "Motor", value: r.codes.motor, mono: true },
          { label: "ESC", value: r.codes.esc, mono: true },
          { label: "Propeller", value: r.codes.prop, mono: true },
          { label: "Quantity", value: `${i.rotors} of each` },
          { label: "Hover time", value: `${n1(r.minutes)} min` },
          { label: "Accuracy", value: "About ±15%" },
          { label: "Prepared", value: today },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <BpSection n="01" title="Matched set">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>TM code</th>
                <th className="num">Qty</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Motor</td>
                <td className="bp-mono font-semibold">{r.codes.motor}</td>
                <td className="num">{i.rotors}</td>
                <td className="bp-dim">{r.motor.standard ? "Standard winding" : "Custom winding"} near {n0(r.kvNeed)} KV for {n0(r.rpmMax)} rpm</td>
              </tr>
              <tr>
                <td>ESC</td>
                <td className="bp-mono font-semibold">{r.codes.esc}</td>
                <td className="num">{i.rotors}</td>
                <td className="bp-dim">{r.esc.amps} A continuous against {n1(r.Ipeak)} A peak</td>
              </tr>
              <tr>
                <td>Propeller</td>
                <td className="bp-mono font-semibold">{r.codes.prop}</td>
                <td className="num">{i.rotors}</td>
                <td className="bp-dim">
                  {r.prop} × {r.propCfg.pitch} in, tip Mach {r.tip.mach}
                </td>
              </tr>
            </tbody>
          </table>
        </BpSection>
        <BpSection n="02" title="Flight time against battery size">
          <figure className="bp-box bp-drawing mt-2">
            <TimeCurve i={i} />
          </figure>
        </BpSection>
        <BpSection n="03" title="Figures">
          <table className="bp-table">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td className="bp-dim w-[45mm]">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>
        {r.warnings.length ? (
          <BpSection n="04" title="Check before ordering">
            <ul className="bp-list bp-dim mt-1">
              {r.warnings.map((w) => (
                <li key={w.text}>{w.text}</li>
              ))}
            </ul>
          </BpSection>
        ) : null}
        <p className="bp-faint mt-6 text-[7pt]">
          Sized at {host}/tools/sizing. Momentum theory with typical propeller, motor and ESC efficiencies, corrected for air density. Expect real figures within about 15%; a
          thrust-stand test of the supplied parts decides.
        </p>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
