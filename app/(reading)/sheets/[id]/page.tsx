import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeChip } from "@/components/quote/QuoteControls";
import { SampleDataTag } from "@/components/ui/Chips";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Layout";
import { PrintButton } from "@/components/ui/PrintButton";
import { LinkButton } from "@/components/ui/Button";
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
    description: `What a supplier must build, document and pass for ${p.name}, under Verkod code ${p.code}.`,
    alternates: { canonical: `/sheets/${p.id}` },
  };
}

const MARKING = [
  "Label every unit, or the smallest pack for parts too small to mark, with the VK code including revision.",
  "Add a batch number and, for electronic and rotating parts, a unit serial number.",
  "Put the VK code, quantity and batch on every carton and on the delivery note.",
  "Keep the supplier's own part number on the label as a cross-reference if you use one.",
];

export default async function BuildSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const category = getCategory(product.category)!;
  const supplier = getSupplier(product.supplierId);
  const revision = product.code.slice(-1);

  return (
    <>
      <Container as="header" className="pb-8 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <nav aria-label="Breadcrumb" className="text-sm text-fg-subtle">
            <Link href={`/parts/${product.id}`} className="inline-flex min-h-11 items-center gap-1 hover:text-fg">
              <Icon name="arrowLeft" size={16} /> Back to {product.name}
            </Link>
          </nav>
          <div className="flex flex-wrap gap-3">
            <PrintButton />
            <LinkButton href={`/suppliers/join?part=${encodeURIComponent(product.code)}`}>Quote to build this</LinkButton>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-line p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold tracking-tight">{SITE.name} build sheet</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
              <p className="mt-2 max-w-2xl text-fg-muted">{product.summary}</p>
            </div>
            <SampleDataTag show={product.placeholder} />
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-fg-subtle">VK code</dt>
              <dd className="mt-1">
                <CodeChip code={product.code} size="sm" />
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Revision</dt>
              <dd className="mt-1 font-medium">{revision}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Category</dt>
              <dd className="mt-1 font-medium">
                {category.name} <span className="code-text text-fg-subtle">({category.code})</span>
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Sector</dt>
              <dd className="mt-1 font-medium">{SECTOR_LABEL[category.sector]}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Sheet date</dt>
              <dd className="mt-1 font-medium">{formatDate(product.lastVerified)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Current supplier</dt>
              <dd className="mt-1 font-medium">
                {supplier ? (
                  <>
                    {supplier.name} <span className="code-text text-fg-subtle">{supplier.code}</span>
                  </>
                ) : (
                  "Open"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Supplier&apos;s own number</dt>
              <dd className="code-text mt-1 font-medium">{product.supplierPartNumber ?? "None"}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Model</dt>
              <dd className="mt-1 font-medium">Illustrative, not a drawing</dd>
            </div>
          </dl>
        </div>
      </Container>

      <Container className="space-y-14 pb-24">
        <section aria-labelledby="req-title">
          <h2 id="req-title" className="text-lg font-semibold tracking-tight">
            1. Requirements
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Build to these values. Where no band is given, state your own tolerance in the quote and we agree it before the first order.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="tabular w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Requirements for {product.code}</caption>
              <thead>
                <tr className="border-b border-line text-xs text-fg-subtle">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Spec
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Value
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Acceptance band
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Our current evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.specs.map((s) => {
                  const ev = findEvidence(product, s.evidenceId);
                  return (
                    <tr key={s.key} className="border-b border-line/70">
                      <th scope="row" className="py-3 pr-4 font-normal text-fg-muted">
                        {s.label}
                      </th>
                      <td className="py-3 pr-4 font-medium">{formatSpecValue(s.value, s.unit)}</td>
                      <td className="py-3 pr-4">{s.tolerance ?? <span className="text-fg-subtle">Supplier to state</span>}</td>
                      <td className="py-3 text-fg-subtle">{ev ? `Tier ${ev.tier}: ${TIER_LABEL[ev.tier]}` : "None"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {product.parts.length ? (
          <section aria-labelledby="bom-title">
            <h2 id="bom-title" className="text-lg font-semibold tracking-tight">
              2. Parts to declare
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              For each part, tell us the material, the maker and the country it is made in. &quot;Unknown&quot; is an acceptable answer: a wrong answer is not.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">Parts to declare for {product.code}</caption>
                <thead>
                  <tr className="border-b border-line text-xs text-fg-subtle">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Line
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Part
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Expected material
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Layer
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      What we will ask
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...product.parts]
                    .sort((a, b) => a.explode.order - b.explode.order)
                    .map((pt, i) => (
                      <tr key={pt.id} className="border-b border-line/70 align-top">
                        <td className="code-text py-3 pr-4 text-fg-subtle">
                          {product.code.replace(/-[A-Z]$/, "")}.{String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-3 pr-4 font-medium">{pt.name}</td>
                        <td className="py-3 pr-4 text-fg-muted">{pt.material}</td>
                        <td className="py-3 pr-4 text-fg-muted">{pt.layers.map((l) => LAYER_LABEL[l]).join(", ")}</td>
                        <td className="py-3 text-fg-muted">{pt.buyingChecks[0]}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="accept-title" className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <h2 id="accept-title" className="text-lg font-semibold tracking-tight">
              {product.parts.length ? "3" : "2"}. How we accept a delivery
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {category.acceptance.map((a) => (
                <li key={a} className="flex gap-3">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{product.parts.length ? "4" : "3"}. Send with your quote</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {category.documents.map((d) => (
                <li key={d} className="flex gap-3">
                  <Icon name="document" size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="mark-title" className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <h2 id="mark-title" className="text-lg font-semibold tracking-tight">
              Marking and labels
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {MARKING.map((m) => (
                <li key={m} className="flex gap-3">
                  <Icon name="code" size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Evidence we will record</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {([1, 2, 3] as const).map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{t}</span>
                  <span>
                    <span className="font-medium">{TIER_LABEL[t]}.</span>{" "}
                    <span className="text-fg-muted">
                      {t === 1
                        ? "Your documents, matched to this code."
                        : t === 2
                          ? "We measure a sample against section 1."
                          : "An outside lab tests a sample and we attach the report."}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-fg-muted">
              Each record says what was checked, what was not, when and by whom. It is shown to buyers on the part page.{" "}
              <Link href="/methodology" className="text-accent hover:underline print:no-underline">
                Methodology
              </Link>
            </p>
          </div>
        </section>

        <p className="border-t border-line pt-6 text-xs text-fg-subtle">
          This sheet describes what we buy under {product.code}. It is not a drawing and the 3D model on the part page is a simplified illustration. A purchase order
          quoting this code and revision refers to this sheet as it stood on the order date.
        </p>
      </Container>
    </>
  );
}
