import Link from "next/link";
import { HeroModel } from "@/components/home/HeroModel";
import { LinkButton } from "@/components/ui/Button";
import { TierGlyph } from "@/components/ui/Icon";
import { Container, SectionHeading } from "@/components/ui/Layout";
import { SampleDataTag } from "@/components/ui/Chips";
import { SITE } from "@/lib/config";
import { getCatalog, getLiveCategories, getManifest, getUpcomingCategories } from "@/lib/content";
import { TIER_LABEL } from "@/lib/format";
import { CategoryArt } from "@/components/catalog/CategoryArt";

const HERO_PRODUCT = "hm-2807-1300kv";

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

export default function HomePage() {
  const catalog = getCatalog();
  const live = getLiveCategories();
  const upcoming = getUpcomingCategories();
  const hero = catalog.find((p) => p.id === HERO_PRODUCT);
  const manifest = getManifest(HERO_PRODUCT);

  return (
    <>
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <Container className="grid grid-cols-1 items-center gap-8 pb-16 pt-14 sm:pt-20 lg:grid-cols-12 lg:pb-24 lg:pt-24">
          <div className="lg:col-span-5">
            <h1 id="hero-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Know exactly what you are buying.
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

      <section aria-labelledby="tiers-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <SectionHeading
            id="tiers-title"
            title="Three evidence tiers, never a vague badge"
            lead="Every claim on this site carries one of three tiers. Each tier says what was checked, what was not, when, and by whom."
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
            title="Live now: drone propulsion and structure"
            lead="Five categories, each with parts you can inspect and request today."
          />
          <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {live.map((c) => {
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
                    <h3 className="mt-4 font-semibold">{c.name}</h3>
                    <p className="mt-1 text-sm text-fg-subtle">{c.summary}</p>
                    <p className="tabular mt-auto pt-4 text-sm text-fg-muted">
                      {count === 1 ? "1 part" : `${count} parts`}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="upcoming-title" className="border-t border-line py-20 sm:py-28">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              id="upcoming-title"
              title="Coming next"
              lead="Visible now so you can plan. Not yet open for requests."
            />
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

      <section aria-labelledby="limits-title" className="border-t border-line py-20 sm:py-28">
        <Container>
          <div className="max-w-3xl">
            <h2 id="limits-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
              What we do not do yet
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              We do not certify parts or suppliers, and nothing here replaces your own qualification testing. Most
              records rest on a single sample, so they say nothing about batch-to-batch spread. We cannot confirm chip
              authenticity beyond visible markings, and the origin of raw materials such as lamination steel is often
              unknown to us; when it is, we say so. We have not yet run long-duration or in-flight tests on any part.
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
