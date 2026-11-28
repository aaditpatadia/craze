import type { Metadata } from "next";
import { Catalog } from "@/components/catalog/Catalog";
import { BatchTestingStrip } from "@/components/catalog/BatchTesting";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCatalog, getLiveCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "All parts: components for drones, robots and data centers",
  description: "Indian-made components for drones, robots and data centers: BLDC motors, ESCs, flight controllers, robot joint actuators, AGV drive wheels, server fans, power supplies and liquid cooling. Each has a TM code, an exploded 3D view, its evidence tier and origin, and every batch is tested before it ships.",
  alternates: { canonical: "/parts" },
};

export default function PartsPage() {
  const items = getCatalog();
  const categories = getLiveCategories().map(({ id, sector, name, singular, filters }) => ({ id, sector, name, singular, filters }));
  return (
    <>
      <PageHeader
        title="All parts"
        lead="Critical components for drones, robots and data centers, made in India. Every listing shows the highest evidence tier we hold and where the part is made, and every batch will be tested before it reaches you. Filter by sector or by what matters to your build."
      />
      <Container className="pb-8">
        <BatchTestingStrip />
      </Container>
      <Container className="pb-24">
        <Catalog items={items} categories={categories} />
      </Container>
    </>
  );
}
