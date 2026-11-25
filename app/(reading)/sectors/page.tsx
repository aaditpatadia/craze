import type { Metadata } from "next";
import Link from "next/link";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { getCatalog, getCategories } from "@/lib/content";
import { SECTOR_LABEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sectors: drones, robotics and data centers",
  description: "The components Verkod lists for drones, robots and data centers, chosen by what buyers need and cannot easily source.",
  alternates: { canonical: "/sectors" },
};

const PITCH: Record<string, string> = {
  aerial: "Propulsion, avionics and structure for defence, agricultural and logistics drones. The parts where import dependence is highest and buyers must prove origin.",
  robotics: "Joints and drive wheels for robot arms, humanoids and warehouse robots. They share magnets, bearings and windings with drone motors, and the same origin questions.",
  compute: "Cooling and power parts for India's data center build-out. Air and liquid cooling, and the power supplies inside every server.",
  energy: "Cells and packs. Listed as upcoming while we qualify suppliers.",
};

export default function SectorsPage() {
  const categories = getCategories();
  const catalog = getCatalog();
  const sectors = (["aerial", "robotics", "compute", "energy"] as const).filter((s) => categories.some((c) => c.sector === s));

  return (
    <>
      <PageHeader
        title="Three sectors, one way of buying"
        lead="Whatever the part, it has a VK code, an exploded view, a build sheet and the evidence behind every claim."
      />
      {sectors.map((s) => {
        const cats = categories.filter((c) => c.sector === s);
        const live = cats.filter((c) => c.status === "live");
        const upcoming = cats.filter((c) => c.status === "upcoming");
        return (
          <section key={s} aria-labelledby={`sector-${s}`} className="border-t border-line py-16">
            <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <SectionHeading id={`sector-${s}`} title={SECTOR_LABEL[s]!} lead={PITCH[s]} />
                {upcoming.length ? (
                  <p className="mt-6 text-sm text-fg-subtle">
                    Upcoming:{" "}
                    {upcoming.map((c, i) => (
                      <span key={c.id}>
                        {i ? ", " : ""}
                        <Link href="/upcoming" className="hover:text-fg">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
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
                        <h3 className="mt-4 flex items-baseline justify-between gap-3 font-semibold">
                          {c.name}
                          <span className="code-text text-xs font-normal text-fg-subtle">VK-{c.code}</span>
                        </h3>
                        <p className="mt-1 text-sm text-fg-subtle">{c.summary}</p>
                        <p className="tabular mt-auto pt-4 text-sm text-fg-muted">{count === 1 ? "1 part" : `${count} parts`}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </section>
        );
      })}
    </>
  );
}
