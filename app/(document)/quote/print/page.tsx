import type { Metadata } from "next";
import { QuotePrint } from "@/components/blueprint/ClientDocs";

export const metadata: Metadata = { title: "Parts list for quotation", robots: { index: false } };

export default function QuotePrintPage() {
  return <QuotePrint />;
}
