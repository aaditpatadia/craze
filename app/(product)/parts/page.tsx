import type { Metadata } from "next";
import { Catalog } from "@/components/catalog/Catalog";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCatalog, getLiveCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "All parts",
  description: "Drone motors, ESCs, flight controllers, propellers and frames, each with its evidence tier and origin shown.",
  alternates: { canonical: "/parts" },
};

export default function PartsPage() {
  const items = getCatalog();
  const categories = getLiveCategories().map(({ id, name, singular, filters }) => ({ id, name, singular, filters }));
  return (
    <>
      <PageHeader
        title="All parts"
        lead="Every listing shows the highest evidence tier we hold, and where the part is made. Filter by what matters to your build."
      />
      <Container className="pb-24">
          <Catalog items={items} categories={categories} />
      </Container>
    </>
  );
}
