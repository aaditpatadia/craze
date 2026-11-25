import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { LastVerified, OriginChip, SampleDataTag, TierChip } from "@/components/ui/Chips";
import { Icon } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { getProduct, getSupplier, getSuppliers, highestTier, findEvidence } from "@/lib/content";
import { formatDate, isStale } from "@/lib/format";

export function generateStaticParams() {
  return getSuppliers().map((s) => ({ id: s.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = getSupplier(id);
  if (!s) return {};
  return {
    title: `${s.name}, supplier profile`,
    description: `What we have checked about ${s.name} in ${s.city}, and what we have not.`,
    alternates: { canonical: `/suppliers/${s.id}` },
  };
}

function StatusRow({ label, ok, children }: { label: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-4 last:border-0">
      <dt className="flex items-center gap-3 font-medium">
        <Icon name={ok ? "check" : "minus"} size={18} className={ok ? "shrink-0 text-fg" : "shrink-0 text-fg-subtle"} />
        {label}
      </dt>
      <dd className="mt-0.5 pl-[30px] text-sm text-fg-muted">{children}</dd>
    </div>
  );
}

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getSupplier(id);
  if (!s) notFound();
  const products = s.parts.map((pid) => getProduct(pid)).filter((p) => !!p);
  const stale = isStale(s.lastVerified);

  return (
    <>
      <Container as="header" className="pb-10 pt-14 sm:pt-20">
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-subtle">
          <span>Supplier profile</span>
          <SampleDataTag show={s.placeholder} />
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{s.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-fg-muted">
          <Icon name="pin" size={16} /> {s.city}, {s.country}
        </p>
        <p className="mt-4 max-w-2xl text-lg text-fg-muted">{s.summary}</p>
        <div className="mt-5">
          <LastVerified date={s.lastVerified} />
        </div>
        {stale ? (
          <div role="note" className="mt-6 flex max-w-2xl gap-3 rounded-xl border border-line-strong bg-bg-subtle p-4 text-sm">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            <p>
              <strong className="font-semibold">This profile is over 12 months old.</strong> Lead times, minimum orders and
              documents may have changed. We will re-check before quoting.
            </p>
          </div>
        ) : null}
      </Container>

      <section aria-labelledby="facts" className="border-t border-line py-14">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="facts" title="Commercial terms" lead="As stated by the supplier. We have not tested them on a real order unless noted." />
          </div>
          <dl className="tabular grid grid-cols-2 gap-6 lg:col-span-8 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-fg-subtle">Lead time</dt>
              <dd className="mt-1 text-xl font-semibold">
                {s.leadTimeDays.min} to {s.leadTimeDays.max} days
              </dd>
            </div>
            <div>
              <dt className="text-sm text-fg-subtle">Minimum order</dt>
              <dd className="mt-1 text-xl font-semibold">
                {s.minOrder.quantity} {s.minOrder.unit}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-fg-subtle">Contact</dt>
              <dd className="mt-1 text-xl font-semibold">{s.contactRole}</dd>
              <dd className="text-xs text-fg-subtle">Introductions go through us</dd>
            </div>
          </dl>
        </Container>
      </section>

      <section aria-labelledby="status" className="border-t border-line py-14">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="status" title="What we have checked" />
          </div>
          <div className="grid grid-cols-1 gap-10 lg:col-span-8 md:grid-cols-2">
            <dl>
              <StatusRow label="Sample" ok={s.sampleReceived.received}>
                {s.sampleReceived.received && s.sampleReceived.date ? `Received ${formatDate(s.sampleReceived.date)}` : "Not received yet"}
              </StatusRow>
              <StatusRow label="Factory check" ok={s.factoryChecked.status !== "not-checked"}>
                {s.factoryChecked.status === "on-site"
                  ? `Visited on site, ${formatDate(s.factoryChecked.date!)}, by ${s.factoryChecked.by}`
                  : s.factoryChecked.status === "remote"
                    ? `Remote video walkthrough only, ${formatDate(s.factoryChecked.date!)}, by ${s.factoryChecked.by}`
                    : "Not checked, in person or remotely"}
              </StatusRow>
            </dl>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Checked</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {s.checked.map((c) => (
                  <li key={c} className="flex gap-2 text-fg-muted">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-fg" /> {c}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-xs font-medium uppercase tracking-wide text-fg-subtle">Not checked</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {s.notChecked.map((c) => (
                  <li key={c} className="flex gap-2 text-fg-muted">
                    <Icon name="minus" size={16} className="mt-0.5 shrink-0 text-fg-subtle" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="docs" className="border-t border-line py-14">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="docs" title="Documents received" lead="Received does not mean verified. Each document's use is listed in the evidence for each part." />
          </div>
          <ul className="divide-y divide-line border-y border-line lg:col-span-8">
            {s.documentsReceived.map((d) => (
              <li key={d.title} className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
                <span className="flex items-center gap-2">
                  <Icon name="document" size={16} className="text-fg-subtle" />
                  {d.url ? (
                    <a className="text-accent hover:underline" href={d.url}>
                      {d.title}
                    </a>
                  ) : (
                    d.title
                  )}
                </span>
                <span className="text-fg-subtle">
                  <time dateTime={d.received}>{formatDate(d.received)}</time>
                  {isStale(d.received) ? <strong className="ml-2 font-medium text-fg">Over 12 months old</strong> : null}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="products" className="border-t border-line py-14">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="products" title="Parts in the catalogue" />
          </div>
          <ul className="divide-y divide-line border-y border-line lg:col-span-8">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <Link href={`/parts/${p.id}`} className="font-medium hover:text-accent">
                  {p.name}
                </Link>
                <span className="flex flex-wrap gap-1.5">
                  <TierChip tier={highestTier(p)} compact />
                  <OriginChip country={p.origin.country} tier={findEvidence(p, p.origin.evidenceId)?.tier ?? null} />
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="border-t border-line py-14">
        <LinkButton href={`/request?part=${encodeURIComponent(`Parts from ${s.name}`)}`}>Request parts from this supplier</LinkButton>
      </Container>
    </>
  );
}
