import type { Metadata } from "next";
import { EscSpecSheet } from "@/components/configure/EscSpecSheet";

export const metadata: Metadata = { title: "ESC specification", robots: { index: false } };

export default function EscSheetPage() {
  return <EscSpecSheet />;
}
