import type { Metadata } from "next";
import Link from "next/link";
import { CategoryArt } from "@/components/catalog/CategoryArt";
import { BatchTesting } from "@/components/catalog/BatchTesting";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Layout";
import { getCatalog, getCategories } from "@/lib/content";
import { SECTOR_LABEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sectors: Indian components for drones, robotics and data centers",
  description: "Timule supplies Indian-made critical components across three sectors: propulsion and avionics for drones, joint actuators and drive wheels for robots, and cooling and power for data centers. One code system, one invoice, and every batch tested before it ships.",
  keywords: ["drone components India", "robot actuator India", "AGV drive wheel India", "server fan India", "server power supply India", "data center liquid cooling India", "batch tested components"],
  alternates: { canonical: "/sectors" },
};

const PITCH: Record<string, string> = {
  aerial: "Motors, ESCs, propellers, flight controllers, GNSS and frames for defence, agricultural and logistics drones. The sector where import dependence is highest and buyers must now prove origin.",
  robotics: "Joint actuators and drive wheels for robot arms, humanoids, AGVs and warehouse robots. Built from the same magnets, bearings and windings as drone motors, and facing the same origin questions.",
  compute: "Server fans, server power supplies and liquid cooling for India's data center build-out. The parts that keep every rack cool and powered, sourced in India instead of imported.",
  energy: "Battery cells and packs. Listed as upcoming while we qualify Indian makers to the same batch-testing standard.",
};

export default function SectorsPage() {
  const categories = getCategories();
  const catalog = getCatalog();
  const sectors = (["aerial", "robotics", "compute", "energy"] as const).filter((s) => categories.some((c) => c.sector === s));

  return (
    <>
      <PageHeader
        title="Three sectors, one way of buying"
        lead="Timule is not only a drone supplier. We supply the critical components inside drones, robots and data centers, made in India. Whatever the part, it has a TM code, an exploded view, a build sheet and the evidence behind every claim, and every batch is tested before it ships."
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
                          <span className="code-text text-xs font-normal text-fg-subtle">TM-{c.code}</span>
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
      <BatchTesting />
    </>
  );
}
