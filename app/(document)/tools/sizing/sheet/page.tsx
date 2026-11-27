import type { Metadata } from "next";
import { SizingSheet } from "@/components/tools/SizingSheet";

export const metadata: Metadata = { title: "Propulsion sizing sheet", robots: { index: false } };

export default function SizingSheetPage() {
  return <SizingSheet />;
}
