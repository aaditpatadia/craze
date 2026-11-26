import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SupplierForm, SupplierFormStatic } from "@/components/forms/SupplierForm";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { getCatalog, getCategories, getLiveCategories } from "@/lib/content";
import { SECTOR_LABEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "For suppliers: build to a TM code",
  description:
    "Make drone, robotics or data center parts? Build to a Timule code and sheet. Buyers see your evidence, not a sales pitch, and you are listed by your supplier code, never by name.",
  alternates: { canonical: "/suppliers/join" },
};

const why = [
  { icon: "code" as const, title: "One code, one sheet", body: "Every part has a TM code and a build sheet: values, acceptance bands, tests and documents. You quote against something exact." },
  { icon: "document" as const, title: "Evidence instead of a pitch", body: "Your documents, our sample measurements and outside lab reports are shown to buyers as they are, with what was not checked." },
  { icon: "cube" as const, title: "Your part, explained", body: "Each listing carries an exploded 3D view and a plain description of every internal part, so buyers understand what they are paying for." },
  { icon: "pin" as const, title: "Origin is an asset", body: "Defence and government buyers must show where parts come from. A maker who documents origin wins those orders." },
];

const steps = [
  "Apply: tick what you make or give your website, and attach your certificates.",
  "We send the build sheets and the documents we need first.",
  "You send datasheets and origin declarations. We record them as Tier 1 evidence.",
  "You send a sample. We measure it against the sheet: Tier 2.",
  "Your evidence appears on the part page under your TMS supplier code, not your name. Buyers order from us by the TM code and we send you the order under the same code.",
];

export default function SupplierJoinPage() {
  const categories = getLiveCategories();
  const catalog = getCatalog();
  const formCategories = getCategories().map((c) => ({ id: c.id, name: c.name, sector: c.sector, live: c.status === "live" }));
  // Certificate uploads switch on when a Vercel Blob store is connected to the project.
  const uploads = !!process.env.BLOB_READ_WRITE_TOKEN;
  const sectors = [...new Set(categories.map((c) => c.sector))];

  return (
    <>
      <PageHeader
        eyebrow={<span>For suppliers</span>}
        title="Build to the code. Show your evidence."
        lead="We list the parts buyers need most. If you make one of them, quote against its TM code and build sheet. Buyers see what you can prove."
      >
        <LinkButton href="/brief/suppliers" variant="secondary">
          <Icon name="download" size={16} /> Supplier brief (PDF)
        </LinkButton>
      </PageHeader>

      <Container className="pb-16">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {why.map((w) => (
            <li key={w.title} className="rounded-xl border border-line p-6">
              <Icon name={w.icon} size={22} className="text-fg-subtle" />
              <h2 className="mt-4 font-semibold">{w.title}</h2>
              <p className="mt-2 text-sm text-fg-muted">{w.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section aria-labelledby="apply-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading id="apply-title" title="Apply to build a part" />
            <div className="mt-8">
              <Suspense fallback={<SupplierFormStatic categories={formCategories} uploads={uploads} />}>
                <SupplierForm categories={formCategories} uploads={uploads} />
              </Suspense>
            </div>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <h2 className="text-sm font-semibold">How it works</h2>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-fg-muted">
                  <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-8 flex gap-2 text-sm text-fg-subtle">
              <Icon name="info" size={16} className="mt-0.5 shrink-0" />
              Applying is free and commits you to nothing. Buyers never see your name, and we never publish your claims or documents without your agreement.
            </p>
          </aside>
        </Container>
      </section>

      <section aria-labelledby="wanted-title" className="border-t border-line py-16">
        <Container>
          <SectionHeading id="wanted-title" title="Parts we are sourcing now" lead="Open any build sheet to see exactly what we buy." />
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
            {sectors.map((s) => (
              <div key={s}>
                <h3 className="text-sm font-semibold">{SECTOR_LABEL[s]}</h3>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {catalog
                    .filter((p) => p.sector === s)
                    .map((p) => (
                      <li key={p.id} className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
                        <span>
                          <span className="block">{p.name}</span>
                          <span className="code-text block text-xs text-fg-subtle">{p.code}</span>
                        </span>
                        <Link href={`/sheets/${p.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
                          Build sheet
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
