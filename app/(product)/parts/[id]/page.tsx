import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { EvidenceList } from "@/components/evidence/EvidenceRecord";
import { PhotoGallery } from "@/components/product/PhotoGallery";
import { PhotoSpin } from "@/components/product/PhotoSpin";
import { LinkButton } from "@/components/ui/Button";
import { Chip, LastVerified, ModelSourceBadge, OriginChip, SampleDataTag, TierChip } from "@/components/ui/Chips";
import { Icon, TierGlyph } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { PartDetails } from "@/components/viewer/PartDetails";
import { Viewer } from "@/components/viewer/Viewer";
import { SITE } from "@/lib/config";
import { AddToQuote, CodeChip } from "@/components/quote/QuoteControls";
import { findEvidence, getCategory, getManifest, getProduct, getProducts, getSourcing, getSupplier, highestTier, supplierSlug } from "@/lib/content";
import { SECTOR_LABEL, SOURCING_LABEL } from "@/lib/format";
import { TIER_LABEL, formatSpecValue, plural } from "@/lib/format";
import { resolveParts } from "@/lib/viewer-data";

export function generateStaticParams() {
  return getProducts().map((p) => ({ id: p.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getProduct(id);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/parts/${p.id}` },
    openGraph: { title: p.name, description: p.summary, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const category = getCategory(product.category)!;
  const supplier = getSupplier(product.supplierId);
  const manifest = getManifest(product.id);
  const parts = resolveParts(product, manifest);
  const top = highestTier(product);
  const motorFrame = product.code.match(/^TM-MOT-(\d{4,5})-(\d+)-[A-Z]$/);
  const originEv = findEvidence(product, product.origin.evidenceId);
  const sourcing = getSourcing(product.id);
  const makers = sourcing?.candidates.length ?? 0;

  // Structured data: facts only. No ratings, no offers, no prices.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    sku: product.code,
    mpn: product.code,
    category: category.name,
    url: `${SITE.url}/parts/${product.id}`,
    brand: { "@type": "Brand", name: SITE.name },
    ...(product.origin.country !== "unknown" && product.origin.country !== "not-yet-verified"
      ? { countryOfAssembly: product.origin.country }
      : {}),
    additionalProperty: product.specs.map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
      ...(s.unit ? { unitText: s.unit } : {}),
    })),
  };

  const requestHref = `/request?part=${encodeURIComponent(`${product.code} ${product.name}`)}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Container as="header" className="pb-8 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-fg-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/parts" className="hover:text-fg">
                Parts
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categories/${category.id}`} className="hover:text-fg">
                {category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-fg-muted">
              {product.name}
            </li>
          </ol>
        </nav>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <SampleDataTag show={product.placeholder} />
              {supplier ? (
                <Link href={`/suppliers/${supplierSlug(supplier)}`} className="text-sm text-fg-subtle hover:text-fg">
                  Supplier <span className="code-text">{supplier.code}</span>, {supplier.country}
                </Link>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CodeChip code={product.code} />
              <span className="text-xs text-fg-subtle">
                {SECTOR_LABEL[category.sector]}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-fg-muted">{product.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <TierChip tier={top} prefix="Highest evidence:" />
              <OriginChip country={product.origin.country} tier={originEv?.tier ?? null} />
              <LastVerified date={product.lastVerified} label={top === 0 ? "Spec issued" : undefined} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <LinkButton href={requestHref}>Request this part</LinkButton>
            <AddToQuote code={product.code} id={product.id} name={product.name} />
            <LinkButton href={`/sheets/${product.id}`} variant="ghost">
              <Icon name="document" size={16} /> Build sheet
            </LinkButton>
            {motorFrame ? (
              <LinkButton href={`/configure/motor?f=${motorFrame[1]}&kv=${motorFrame[2]}`} variant="ghost">
                <Icon name="code" size={16} /> Configure this motor
              </LinkButton>
            ) : null}
          </div>
        </div>
      </Container>

      <Container className="pb-16">
        {manifest ? (
          <Viewer
            manifest={manifest}
            parts={parts}
            productId={product.id}
            productName={product.name}
            category={category.id}
            categorySingular={category.singular}
          />
        ) : product.photoSpin ? (
          <PhotoSpin {...product.photoSpin} label={product.name} />
        ) : (
          <div className="grid grid-cols-1 items-center gap-8 rounded-xl border border-line bg-bg-subtle p-8 md:grid-cols-2">
            <div className="mx-auto aspect-[12/7] w-full max-w-sm opacity-70">
              <CategoryArt category={category.id} label={category.singular} />
            </div>
            <div>
              <ModelSourceBadge source={null} />
              <p className="mt-4 font-medium">There is no 3D model or photo set for this part yet.</p>
              <p className="mt-2 text-sm text-fg-muted">
                We add a model when the supplier sends CAD, or a 360 degree photo set once we have photographed the actual
                sample. The drawing on the left shows the category, not this product.
              </p>
            </div>
          </div>
        )}
      </Container>

      <section aria-labelledby="specs-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="specs-title" title="Key specs" lead="Each value shows the evidence tier behind it." />
          </div>
          <div className="lg:col-span-8">
            <table className="tabular w-full text-left text-sm">
              <caption className="sr-only">Key specs for {product.name}</caption>
              <thead>
                <tr className="border-b border-line text-xs text-fg-subtle">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Spec
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Value
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.specs.map((s) => {
                  const ev = findEvidence(product, s.evidenceId);
                  const tier = ev?.tier ?? 0;
                  return (
                    <tr key={s.key} className="border-b border-line/70">
                      <th scope="row" className="py-3 pr-4 font-normal text-fg-muted">
                        {s.label}
                      </th>
                      <td className="py-3 pr-4 text-base font-medium">{formatSpecValue(s.value, s.unit)}</td>
                      <td className="py-3 text-fg-subtle">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <TierGlyph tier={tier} size={12} />
                          {TIER_LABEL[tier]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-6 flex flex-wrap gap-1.5">
              <span className="mr-1 text-sm text-fg-subtle">Used in:</span>
              {product.applications.map((a) => (
                <Chip key={a}>{a}</Chip>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="demand-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="demand-title" title="Why we list this part" lead="We list parts that buyers are asking for. Each reason links to its source." />
          </div>
          <div className="lg:col-span-8">
            <p className="text-base text-fg">{product.demand.reason}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className="mr-1 text-sm text-fg-subtle">Bought by:</span>
              {product.demand.buyers.map((b) => (
                <Chip key={b}>{b}</Chip>
              ))}
            </div>
            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              {product.demand.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-fg-muted hover:text-fg">
                    <Icon name="external" size={14} className="mt-0.5 shrink-0" />
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section aria-labelledby="sourcing-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="sourcing-title"
              title="Sourcing"
              lead="Every supplier builds to the same TM code and build sheet, so the part you order is the part you get, whoever makes it."
            />
          </div>
          <div className="lg:col-span-8">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-line p-4">
                <dt className="text-fg-subtle">Status</dt>
                <dd className="mt-1 font-medium">{sourcing ? SOURCING_LABEL[sourcing.status] : "Not started"}</dd>
              </div>
              <div className="rounded-xl border border-line p-4">
                <dt className="text-fg-subtle">Makers identified</dt>
                <dd className="tabular mt-1 font-medium">{sourcing?.candidates.length ?? 0}</dd>
              </div>
              <div className="rounded-xl border border-line p-4">
                <dt className="text-fg-subtle">Build to</dt>
                <dd className="mt-1 font-medium">
                  <Link href={`/sheets/${product.id}`} className="code-text text-accent hover:underline">
                    {product.code}
                  </Link>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-fg-muted">
              {makers > 0
                ? `${makers === 1 ? "One maker is" : `${makers} makers are`} being qualified. You buy from ${SITE.name} under the TM code, and every maker is listed by its TMS code, so a change of maker never changes your drawings or paperwork.`
                : "We are still looking for makers of this part. Buyers can request it now: we source to the build sheet."}
            </p>
            <p className="mt-4">
              <Link href={`/suppliers/join?part=${encodeURIComponent(product.code)}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline">
                <Icon name="factory" size={16} /> Make this part? Apply as a supplier
              </Link>
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="evidence-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="evidence-title"
              title="Evidence for this product"
              lead="What was checked, what was not, when and by whom. Part-level evidence is in each part's details."
            />
            <Link href="/methodology" className="mt-4 inline-block text-sm text-accent hover:underline">
              How evidence tiers work
            </Link>
          </div>
          <div className="lg:col-span-8">
            <EvidenceList items={product.evidence} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="parts-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="parts-title"
              title={parts.length ? `${plural(parts.length, "part")}, explained` : "Internal parts"}
              lead={parts.length ? "The same information as the 3D view, as text. Open any part for full details." : undefined}
            />
          </div>
          <div className="lg:col-span-8">
            {parts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-fg-muted">
                {product.partsNote ?? "We have not documented the internal parts of this product yet."}
              </p>
            ) : (
              <ol className="divide-y divide-line border-y border-line">
                {parts.map((p, i) => (
                  <li key={p.id} id={`part-${p.id}`}>
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs text-fg-subtle">
                          {i + 1}
                        </span>
                        <span className="flex-1">
                          <span className="block font-medium">{p.name}</span>
                          <span className="block text-sm text-fg-subtle">{p.role}</span>
                        </span>
                        <Icon name="plus" size={16} className="text-fg-subtle transition-transform duration-200 group-open:rotate-45" />
                      </summary>
                      <div className="pb-8 pl-10 pt-2">
                        <PartDetails
                          part={p}
                          neighbours={p.interactsWith
                            .map((n) => parts.find((x) => x.id === n))
                            .filter((x): x is (typeof parts)[number] => !!x)
                            .map(({ id: nid, name }) => ({ id: nid, name }))}
                        />
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Container>
      </section>

      <section aria-labelledby="photos-title" className="border-t border-line py-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="photos-title" title="Photos of the actual sample" lead="Only photos we took of the unit we inspected, each dated." />
          </div>
          <div className="lg:col-span-8">
            <PhotoGallery photos={product.photos} sampleReceived={supplier?.sampleReceived.received ?? false} />
          </div>
        </Container>
      </section>

      {supplier ? (
        <section aria-labelledby="supplier-title" className="border-t border-line py-16">
          <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading id="supplier-title" title="Supplier" />
            </div>
            <div className="rounded-xl border border-line p-6 lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="code-text">{supplier.code}</span>
                    <SampleDataTag show={supplier.placeholder} />
                  </p>
                  <p className="mt-1 text-sm text-fg-subtle">
                    Ships from {supplier.country}. You order from {SITE.name}, not from the maker.
                  </p>
                </div>
                <LinkButton href={`/suppliers/${supplierSlug(supplier)}`} variant="secondary">
                  Supplier profile
                </LinkButton>
              </div>
              <dl className="tabular mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-fg-subtle">Lead time</dt>
                  <dd className="mt-1 font-medium">
                    {supplier.leadTimeDays.min} to {supplier.leadTimeDays.max} days
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Minimum order</dt>
                  <dd className="mt-1 font-medium">
                    {supplier.minOrder.quantity} {supplier.minOrder.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Sample</dt>
                  <dd className="mt-1 font-medium">{supplier.sampleReceived.received ? "Received" : "Not received"}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Factory check</dt>
                  <dd className="mt-1 font-medium">
                    {supplier.factoryChecked.status === "on-site" ? "On site" : supplier.factoryChecked.status === "remote" ? "Remote only" : "Not checked"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <LastVerified date={supplier.lastVerified} label="Supplier last verified" />
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-line py-16">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Need this part, or something like it?</h2>
            <p className="mt-2 text-fg-muted">Send a request or check a whole bill of materials against the catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={requestHref}>Request this part</LinkButton>
            <AddToQuote code={product.code} id={product.id} name={product.name} />
          </div>
        </Container>
      </section>
    </>
  );
}
