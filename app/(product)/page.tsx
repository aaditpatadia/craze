import Link from "next/link";
import { HeroModel } from "@/components/home/HeroModel";
import { LinkButton } from "@/components/ui/Button";
import { TierGlyph } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { SampleDataTag } from "@/components/ui/Chips";
import { SITE } from "@/lib/config";
import { getCatalog, getLiveCategories, getManifest, getUpcomingCategories } from "@/lib/content";
import { SECTOR_LABEL, TIER_LABEL } from "@/lib/format";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { BatchTesting } from "@/components/catalog/BatchTesting";

const HERO_PRODUCT = "tm-mot-2807-1300";

const tiers = [
  {
    tier: 1 as const,
    body: "The supplier sent us documents: a datasheet, a material certificate, a declaration. We read them and match them to the part. We have not measured anything ourselves.",
  },
  {
    tier: 2 as const,
    body: "We held a physical sample and measured it. Each record lists what we measured, how, and on how many samples.",
  },
  {
    tier: 3 as const,
    body: "An outside lab tested the part and we attach the report. We name the lab and the conditions of the test.",
  },
];

const codeAnatomy = [
  { label: "Prefix", value: "TM", note: "Timule" },
  { label: "Category", value: "MOT", note: "BLDC motor" },
  { label: "Stator", value: "2807", note: "28 by 7 mm" },
  { label: "KV", value: "1300", note: "rpm per volt" },
  { label: "Revision", value: "A", note: "First release" },
];

const codeRoles = [
  {
    title: "Buyers order by it",
    body: "Paste TM codes or plain part names into the BOM checker, or collect parts in a quote list and send one request.",
    href: "/bom",
    link: "Check a BOM",
  },
  {
    title: "Suppliers build to it",
    body: "Each code has a build sheet: values, acceptance bands, tests, documents and marking. Any qualified maker can quote against it.",
    href: "/suppliers/join",
    link: "For suppliers",
  },
  {
    title: "Evidence travels with it",
    body: "Documents, sample measurements and lab reports are filed under the code, with what was not checked, when and by whom.",
    href: "/codes",
    link: "How codes work",
  },
];

export default function HomePage() {
  const catalog = getCatalog();
  const live = getLiveCategories();
  const upcoming = getUpcomingCategories();
  const hero = catalog.find((p) => p.id === HERO_PRODUCT);
  const manifest = getManifest(HERO_PRODUCT);
  const sectors = [...new Set(live.map((c) => c.sector))];

  return (
    <>
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <Container className="grid grid-cols-1 items-center gap-8 pb-16 pt-14 sm:pt-20 lg:grid-cols-12 lg:pb-24 lg:pt-24">
          <div className="lg:col-span-5">
            <p className="code-text whitespace-normal text-xs text-accent">INDIAN COMPONENTS FOR DRONES, ROBOTS AND DATA CENTERS</p>
            <h1 id="hero-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              One code for every critical part.
            </h1>
            <p className="mt-6 max-w-md text-lg text-fg-muted">{SITE.promise}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/parts" size="lg">
                Explore parts
              </LinkButton>
              <LinkButton href="/bom" variant="secondary" size="lg">
                Send your bill of materials
              </LinkButton>
            </div>
            <p className="mt-8 text-sm text-fg-subtle">
              Energy storage and chips next.{" "}
              <Link href="/suppliers/join" className="text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                Make parts? Build to our codes.
              </Link>
            </p>
          </div>
          <div className="lg:col-span-7">
            <HeroModel manifest={manifest ?? null} />
            {hero ? (
              <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-fg-subtle">
                <Link href={`/parts/${hero.id}`} className="text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                  {hero.name}
                </Link>
                <SampleDataTag show={hero.placeholder} />
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <section aria-labelledby="code-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="code-title"
            title="Buyers order by it. Suppliers build to it."
            lead="Every part we list gets a TM code and a build sheet. The same code is on the quote, the purchase order, the label and the evidence, so nobody has to translate."
          />
          <ol className="mt-12 flex flex-wrap items-stretch gap-2" aria-label="Parts of the code TM-MOT-2807-1300-A">
            {codeAnatomy.map((seg) => (
              <li key={seg.label} className="min-w-24 rounded-lg border border-line bg-bg-subtle px-4 py-3">
                <span className="block text-[11px] uppercase tracking-wide text-fg-subtle">{seg.label}</span>
                <span className="code-text block text-2xl font-semibold">{seg.value}</span>
                <span className="block text-xs text-fg-muted">{seg.note}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {codeRoles.map((r) => (
              <li key={r.title} className="rounded-xl border border-line p-6">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{r.body}</p>
                <Link href={r.href} className="mt-4 inline-block text-sm text-accent hover:underline">
                  {r.link}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="tiers-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="tiers-title"
            title="Three evidence tiers, never a vague badge"
            lead="Every claim on this site carries one of three tiers, or says plainly that it is not yet verified. Each tier says what was checked, what was not, when, and by whom."
          />
          <ol className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {tiers.map((t) => (
              <li key={t.tier} className="rounded-xl border border-line bg-bg-subtle p-6">
                <div className="flex items-center gap-2 text-sm text-fg-subtle">
                  <TierGlyph tier={t.tier} size={16} />
                  Tier {t.tier}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{TIER_LABEL[t.tier]}</h3>
                <p className="mt-3 text-sm text-fg-muted">{t.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm">
            <Link href="/methodology" className="text-accent hover:underline">
              Read the full methodology
            </Link>
          </p>
        </Container>
      </section>

      <section aria-labelledby="live-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="live-title"
            title="Live now in three sectors"
            lead={`${live.length} categories and ${catalog.length} parts, chosen by what buyers are asking for. Every one opens into an exploded 3D view.`}
          />
          {sectors.map((sector) => (
            <div key={sector} className="mt-12">
              <h3 className="flex items-baseline justify-between gap-4 text-sm font-semibold">
                {SECTOR_LABEL[sector]}
                <Link href="/sectors" className="text-xs font-normal text-fg-subtle hover:text-fg">
                  About this sector
                </Link>
              </h3>
              <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {live
                  .filter((c) => c.sector === sector)
                  .map((c) => {
                    const count = catalog.filter((p) => p.category === c.id).length;
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/categories/${c.id}`}
                          className="group flex h-full flex-col rounded-xl border border-line bg-bg-elev p-5 transition-colors duration-300 hover:border-line-strong"
                        >
                          <div className="aspect-[12/7]">
                            <CategoryArt category={c.id} label={c.singular} />
                          </div>
                          <h4 className="mt-4 font-semibold">{c.name}</h4>
                          <p className="mt-1 text-sm text-fg-subtle">{c.summary}</p>
                          <p className="tabular mt-auto pt-4 text-sm text-fg-muted">{count === 1 ? "1 part" : `${count} parts`}</p>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </Container>
      </section>

      <section aria-labelledby="upcoming-title" className="border-t border-line py-20 sm:py-28">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading id="upcoming-title" title="Coming next" lead="Visible now so you can plan. Not yet open for requests." />
            <LinkButton href="/upcoming" variant="secondary" className="mt-8">
              Get notified
            </LinkButton>
          </div>
          <ul className="divide-y divide-line border-y border-line lg:col-span-8">
            {upcoming.map((c) => (
              <li key={c.id} className="grid grid-cols-1 gap-1 py-5 sm:grid-cols-12 sm:gap-6">
                <p className="font-medium sm:col-span-4">{c.name}</p>
                <p className="text-sm text-fg-muted sm:col-span-8">{c.whyItMatters}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="suppliers-title" className="border-t border-line py-20 sm:py-28">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 id="suppliers-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
              Make one of these parts?
            </h2>
            <p className="mt-3 text-fg-muted">
              Quote against the TM code and build sheet. Buyers see your documents and our measurements under your supplier code, never your name.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/suppliers/join">Apply as a supplier</LinkButton>
            <LinkButton href="/codes" variant="secondary">
              How codes work
            </LinkButton>
          </div>
        </Container>
      </section>

      <BatchTesting />

      <section aria-labelledby="limits-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <div className="max-w-3xl">
            <h2 id="limits-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
              What we do not do yet
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              We do not certify parts or suppliers, and nothing here replaces your own qualification testing. The evidence on a listing often rests on a single
              qualification sample; batch testing on every order is what covers spread between batches. We cannot confirm chip authenticity beyond visible markings, and the origin of raw materials such as
              lamination steel is often unknown to us; when it is, we say so. We have not yet run long-duration or in-flight tests on any part.
            </p>
            <Link href="/about" className="mt-6 inline-block text-sm text-accent hover:underline">
              Our full list of limits
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
