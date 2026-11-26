import type { Metadata } from "next";
import { BomReport } from "@/components/blueprint/ClientDocs";

export const metadata: Metadata = { title: "BOM check report", robots: { index: false } };

export default function BomReportPage() {
  return <BomReport />;
}
