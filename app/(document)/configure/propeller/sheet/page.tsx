import type { Metadata } from "next";
import { PropSpecSheet } from "@/components/configure/PropSpecSheet";

export const metadata: Metadata = { title: "Propeller specification", robots: { index: false } };

export default function PropellerSheetPage() {
  return <PropSpecSheet />;
}
