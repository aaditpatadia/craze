import type { Metadata } from "next";
import Link from "next/link";
import { CodeDecoder } from "@/components/codes/CodeDecoder";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { getCategories, getProducts, getSuppliers, getSupplier } from "@/lib/content";
import { SECTOR_LABEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "TM codes: one number for every part",
  description:
    "How Timule part codes work. Buyers order by the TM code, suppliers build to the sheet behind it, and the evidence follows the code from quote to delivery.",
  alternates: { canonical: "/codes" },
};

const references = [
  { code: "TM-MOT-2807-1300-A", what: "Part code", body: "What is bought and built. Printed on the label, the quote, the purchase order and the delivery note." },
  { code: "TM-MOT-2807-1300.03", what: "Part line", body: "One internal part on the build sheet, so a supplier and a buyer can point at the same magnet or bearing." },
  { code: "TMS-001", what: "Supplier code", body: "Each supplier we work with. It stays the same if the company changes its name." },
  { code: "TMQ-261126-7KQ4", what: "Request reference", body: "Issued when a buyer sends a request. Date first, then four characters that cannot be confused, such as no 0 and O." },
  { code: "TMA-261126-M2XD", what: "Supplier application", body: "Issued when a maker applies to build a part." },
];

const rules = [
  "A code describes the part, not the supplier. Two makers building the same sheet ship the same code.",
  "Spec segments are the numbers an engineer already uses: stator size and KV for a motor, current and cells for an ESC.",
  "Any change that affects fit, function or a declared origin moves the revision letter. A is the first release.",
  "Codes are never reused. A withdrawn code stays withdrawn.",
  "We cross-reference every supplier's own part number, so a buyer can paste either into the BOM checker.",
];

export default function CodesPage() {
  const categories = getCategories();
  const products = getProducts();
  const suppliers = getSuppliers();
  const codeCats = categories.map((c) => ({ code: c.code, id: c.id, name: c.name, sector: c.sector }));
  const parts = products.map((p) => ({ code: p.code, id: p.id, name: p.name }));
  const sectors = [...new Set(categories.map((c) => c.sector))];

  return (
    <>
      <PageHeader
        title="One code for every part"
        lead="Buyers order by the TM code. Suppliers build to the sheet behind it. The evidence travels with the code, so everyone in the chain means the same part."
      />
      <Container className="grid grid-cols-1 gap-14 pb-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CodeDecoder categories={codeCats} parts={parts} />
        </div>
        <div className="lg:col-span-5">
          <h2 className="text-sm font-semibold">The rules</h2>
          <ol className="mt-4 space-y-4">
            {rules.map((r, i) => (
              <li key={r} className="flex gap-3 text-sm text-fg-muted">
                <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
        </div>
      </Container>

      <section aria-labelledby="refs-title" className="border-t border-line py-16">
        <Container>
          <SectionHeading id="refs-title" title="Every number in the chain" />
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {references.map((r) => (
              <li key={r.code} className="rounded-xl border border-line p-5">
                <p className="code-text text-base font-semibold">{r.code}</p>
                <p className="mt-1 text-sm font-medium">{r.what}</p>
                <p className="mt-2 text-sm text-fg-muted">{r.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="cats-title" className="border-t border-line py-16">
        <Container>
          <SectionHeading id="cats-title" title="Category codes" lead="Three letters after TM. Upcoming categories already have theirs." />
          <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
            {sectors.map((s) => (
              <div key={s}>
                <h3 className="text-sm font-semibold">{SECTOR_LABEL[s]}</h3>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {categories
                    .filter((c) => c.sector === s)
                    .map((c) => (
                      <li key={c.id} className="flex min-h-12 items-center gap-4 py-2 text-sm">
                        <span className="code-text w-12 font-semibold">{c.code}</span>
                        {c.status === "live" ? (
                          <Link href={`/categories/${c.id}`} className="flex-1 hover:text-accent">
                            {c.name}
                          </Link>
                        ) : (
                          <span className="flex-1 text-fg-muted">{c.name}</span>
                        )}
                        <span className="text-xs text-fg-subtle">{c.status === "live" ? "Live" : "Upcoming"}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="all-title" className="border-t border-line py-16">
        <Container>
          <SectionHeading id="all-title" title="All issued part codes" lead={`${products.length} codes issued, across ${suppliers.length} suppliers.`} />
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">All issued TM part codes</caption>
              <thead>
                <tr className="border-b border-line text-xs text-fg-subtle">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    TM code
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Part
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Supplier
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/70">
                    <td className="code-text py-3 pr-4 font-medium">
                      <Link href={`/parts/${p.id}`} className="hover:text-accent">
                        {p.code}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-fg-muted">{p.name}</td>
                    <td className="code-text py-3 text-fg-subtle">{getSupplier(p.supplierId)?.code ?? "Open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
