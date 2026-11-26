import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlueprintDocument, BlueprintSheet, BpField, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { SITE } from "@/lib/config";
import { findEvidence, getCategory, getProduct, getProducts, getSupplier } from "@/lib/content";
import { LAYER_LABEL, SECTOR_LABEL, TIER_LABEL, formatDate, formatSpecValue } from "@/lib/format";

export function generateStaticParams() {
  return getProducts().map((p) => ({ id: p.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getProduct(id);
  if (!p) return {};
  return {
    title: `Build sheet ${p.code}`,
    description: `What a supplier must build, document and pass for ${p.name}, under Timule code ${p.code}.`,
    alternates: { canonical: `/sheets/${p.id}` },
  };
}

const MARKING = [
  "Label every unit, or the smallest pack for parts too small to mark, with the TM code including revision.",
  "Add a batch number and, for electronic and rotating parts, a unit serial number.",
  "Put the TM code, quantity, batch and our purchase order number on every carton and on the delivery note.",
  "Do not print your own brand or part number on Timule parts unless the order says so.",
];

const TIER_DO: Record<1 | 2 | 3, string> = {
  1: "Your documents, matched to this code.",
  2: "We measure a sample against section 01.",
  3: "An outside lab tests a sample and we attach the report.",
};

export default async function BuildSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const category = getCategory(product.category)!;
  const supplier = getSupplier(product.supplierId);
  const revision = product.code.slice(-1);
  const base = product.code.replace(/-[A-Z]$/, "");
  const parts = [...product.parts].sort((a, b) => a.explode.order - b.explode.order);
  const n = (i: number) => String(i).padStart(2, "0");
  let s = 1;

  return (
    <BlueprintDocument toolbar={<BpToolbar back={{ href: `/parts/${product.id}`, label: product.name }} fileName={`${product.code} Timule build sheet`} />}>
      <BlueprintSheet
        kind="Build sheet"
        title={product.name}
        number={product.code}
        status={product.placeholder ? "Sample data" : null}
        fields={[
          { label: "Document", value: "Build sheet" },
          { label: "TM code", value: product.code, mono: true },
          { label: "Revision", value: revision, mono: true },
          { label: "Category", value: `${category.name} (${category.code})` },
          { label: "Sheet date", value: formatDate(product.lastVerified) },
          { label: "Current supplier", value: supplier?.code ?? "Open", mono: true },
          { label: "Sector", value: SECTOR_LABEL[category.sector] },
          { label: "Drawing", value: "Schematic, not to scale" },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="bp-dim">{product.summary}</p>
            <div className="bp-fields mt-5 grid-cols-2">
              <BpField label="Order by" mono>
                {product.code}
              </BpField>
              <BpField label="Part lines" mono>
                {parts.length ? `${base}.01 to .${n(parts.length)}` : "One-piece part"}
              </BpField>
              <BpField label="Build sheet online">{`${SITE.url.replace(/^https?:\/\//, "")}/sheets/${product.id}`}</BpField>
              <BpField label="Part page">{`${SITE.url.replace(/^https?:\/\//, "")}/parts/${product.id}`}</BpField>
            </div>
          </div>
          <figure className="bp-box bp-drawing">
            <CategoryArt category={category.id} label={category.singular} className="w-full" />
            <figcaption className="bp-faint mt-1 flex justify-between text-[6.5pt] tracking-[0.12em]">
              <span>VIEW A · SCHEMATIC</span>
              <span className="bp-mono">{base}</span>
            </figcaption>
          </figure>
        </div>

        <BpSection n={n(s++)} title="Requirements">
          <p className="bp-dim mt-2">Build to these values. Where no band is given, state your tolerance in the quote and we agree it before the first order.</p>
          <table className="bp-table">
            <thead>
              <tr>
                <th>Spec</th>
                <th>Value</th>
                <th>Acceptance band</th>
                <th>Current evidence</th>
              </tr>
            </thead>
            <tbody>
              {product.specs.map((sp) => {
                const ev = findEvidence(product, sp.evidenceId);
                return (
                  <tr key={sp.key}>
                    <td className="bp-dim">{sp.label}</td>
                    <td className="font-semibold">{formatSpecValue(sp.value, sp.unit)}</td>
                    <td>{sp.tolerance ?? <span className="bp-faint">Supplier to state</span>}</td>
                    <td className="bp-faint">{ev ? `Tier ${ev.tier}: ${TIER_LABEL[ev.tier]}` : "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BpSection>

        {parts.length ? (
          <BpSection n={n(s++)} title="Parts to declare">
            <p className="bp-dim mt-2">For each line, give the material, its maker and the country it is made in. &quot;Unknown&quot; is an acceptable answer. A wrong answer is not.</p>
            <table className="bp-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Part</th>
                  <th>Expected material</th>
                  <th>Layer</th>
                  <th>We will ask</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((pt, i) => (
                  <tr key={pt.id}>
                    <td className="bp-mono bp-accent whitespace-nowrap">
                      {base}.{n(i + 1)}
                    </td>
                    <td className="font-semibold">{pt.name}</td>
                    <td className="bp-dim">{pt.material}</td>
                    <td className="bp-dim">{pt.layers.map((l) => LAYER_LABEL[l]).join(", ")}</td>
                    <td className="bp-dim">{pt.buyingChecks[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BpSection>
        ) : null}

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <BpSection n={n(s++)} title="Acceptance">
            <ul className="bp-list bp-dim mt-1">
              {category.acceptance.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </BpSection>
          <BpSection n={n(s++)} title="Send with your quote">
            <ul className="bp-list bp-dim mt-1">
              {category.documents.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </BpSection>
        </div>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <BpSection n={n(s++)} title="Marking">
            <ul className="bp-list bp-dim mt-1">
              {MARKING.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <div className="bp-box mt-4 flex items-center justify-between gap-3">
              <span>
                <span className="bp-label">Label example</span>
                <span className="bp-value bp-mono font-semibold">{product.code}</span>
                <span className="bp-faint bp-mono text-[7pt]">BATCH 2611-01 · SN 000123 · TMP-xxxxxx</span>
              </span>
              <span className="bp-mono bp-faint text-[6.5pt]">TIMULE</span>
            </div>
          </BpSection>
          <BpSection n={n(s++)} title="Evidence we record">
            <ol className="bp-dim mt-2 space-y-1.5">
              {([1, 2, 3] as const).map((t) => (
                <li key={t}>
                  <span className="bp-mono bp-accent">T{t}</span> <span className="text-[color:var(--bp-ink)]">{TIER_LABEL[t]}.</span> {TIER_DO[t]}
                </li>
              ))}
            </ol>
            <p className="bp-faint mt-3">Each record says what was checked, what was not, when and by whom. Buyers see it on the part page, under your supplier code, never your name.</p>
          </BpSection>
        </div>

        <p className="bp-faint mt-8 border-t pt-3 text-[7pt]" style={{ borderColor: "var(--bp-rule)" }}>
          This sheet defines what Timule buys and sells under {product.code}. A purchase order quoting this code and revision refers to this sheet as it stood on the order date.
          The drawing is a schematic of the category, not a drawing of this part. Confidential to Timule, its buyers and the suppliers it invites to quote.
        </p>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
