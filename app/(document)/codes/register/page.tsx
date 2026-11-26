import type { Metadata } from "next";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { getCategories, getProducts, getSupplier, getSuppliers } from "@/lib/content";
import { FRAMES, frameDims } from "@/lib/motor-config";
import { SECTOR_LABEL, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Timule code register",
  description: "Every Timule part code, category code and supplier code on one printable sheet.",
  alternates: { canonical: "/codes/register" },
};

const REFS = [
  ["TM-MOT-2807-1300-A", "Part code: prefix, category, spec segments, revision"],
  ["TM-MOT-2807-1300.03", "Part line: one internal part on a build sheet"],
  ["TMS-001", "Supplier code. Buyers see this, never the maker's name"],
  ["TMQ-261126-7KQ4", "Request or quotation"],
  ["TMA-261126-M2XD", "Supplier application"],
  ["TMP-261126-4HZ8", "Purchase order to a supplier"],
  ["TMI-261126-Q7NB", "Invoice to a buyer"],
];

export default function CodeRegisterPage() {
  const categories = getCategories();
  const products = getProducts();
  const issued = new Date().toISOString().slice(0, 10);
  const sectors = [...new Set(categories.map((c) => c.sector))];

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: "/codes", label: "TM codes" }} fileName={`Timule code register ${issued}`} />}>
      <BlueprintSheet
        kind="Code register"
        title="Timule code register"
        number={`TM-REG-${issued.slice(2).replace(/-/g, "")}`}
        fields={[
          { label: "Document", value: "Code register" },
          { label: "Part codes", value: String(products.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Issued", value: formatDate(issued) },
          { label: "Suppliers", value: String(getSuppliers().length) },
          { label: "Revision", value: "Live", mono: true },
          { label: "Prefix", value: "TM", mono: true },
          { label: "Valid", value: "On the issue date" },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <p className="bp-dim mt-3 max-w-[150mm]">
          One code for every part. Buyers order by the TM code, suppliers build to the build sheet behind it, and every label, purchase order and invoice carries it.
        </p>

        <BpSection n="01" title="Reference formats">
          <table className="bp-table">
            <tbody>
              {REFS.map(([code, what]) => (
                <tr key={code}>
                  <td className="bp-mono bp-accent w-[52mm] whitespace-nowrap">{code}</td>
                  <td className="bp-dim">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>

        <BpSection n="02" title="Category codes">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Sector</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sectors.flatMap((sector) =>
                categories
                  .filter((c) => c.sector === sector)
                  .map((c) => (
                    <tr key={c.id}>
                      <td className="bp-mono font-semibold">TM-{c.code}</td>
                      <td>{c.name}</td>
                      <td className="bp-dim">{SECTOR_LABEL[sector]}</td>
                      <td className="bp-dim">{c.status === "live" ? "Live" : "Upcoming"}</td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </BpSection>

        <BpSection n="03" title="Issued part codes">
          <table className="bp-table">
            <thead>
              <tr>
                <th>TM code</th>
                <th>Part</th>
                <th>Supplier</th>
                <th>Sheet date</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="bp-mono whitespace-nowrap font-semibold">{p.code}</td>
                  <td>{p.name}</td>
                  <td className="bp-mono bp-dim">{getSupplier(p.supplierId)?.code ?? "Open"}</td>
                  <td className="bp-dim whitespace-nowrap">{formatDate(p.lastVerified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>

        <BpSection n="04" title="Standard motor frames">
          <p className="bp-dim mt-2">Every frame and winding can be ordered by its code and configured at /configure/motor.</p>
          <table className="bp-table">
            <thead>
              <tr>
                <th>Frame</th>
                <th>Stator</th>
                <th>TM codes</th>
                <th>Propellers</th>
              </tr>
            </thead>
            <tbody>
              {FRAMES.map((f) => {
                const { d, h } = frameDims(f.size);
                return (
                  <tr key={f.size}>
                    <td className="bp-mono font-semibold">{f.size}</td>
                    <td className="bp-dim whitespace-nowrap">
                      {d} × {h} mm
                    </td>
                    <td className="bp-mono text-[7.5pt]">{f.kvs.map((k) => `TM-MOT-${f.size}-${k.kv}-A`).join("  ")}</td>
                    <td className="bp-dim">{f.props}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BpSection>

        <p className="bp-faint mt-8 text-[7pt]">
          Codes are never reused. A change to fit, function or declared origin moves the revision letter. Current build sheets are at /sheets on the Timule site.
        </p>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
