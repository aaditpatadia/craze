import type { Metadata } from "next";
import { BomChecker } from "@/components/bom/BomChecker";
import { Container, PageHeader } from "@/components/ui/Layout";
import { SITE } from "@/lib/config";
import { getCatalog } from "@/lib/content";

export const metadata: Metadata = {
  title: "BOM checker",
  description: "Paste or upload a bill of materials and see which rows match parts in the catalogue, with origin and evidence tier for each.",
  alternates: { canonical: "/bom" },
};

export default function BomPage() {
  return (
    <>
      <PageHeader
        title="Check your bill of materials"
        lead="See which rows we already list, where each matched part is made and what evidence backs it. Rows with no match can go straight to a sourcing request."
      />
      <Container className="pb-24">
        <BomChecker catalog={getCatalog()} siteUrl={SITE.url} />
      </Container>
    </>
  );
}
