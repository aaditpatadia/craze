import type { Metadata } from "next";
import { Desk } from "@/components/blueprint/Desk";
import { getCategories, getProducts, getSuppliers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Desk: quotations, purchase orders and invoices",
  robots: { index: false, follow: false },
};

export default function DeskPage() {
  const cats = new Map(getCategories().map((c) => [c.id, c.code]));
  const parts = getProducts().map((p) => ({ code: p.code, name: p.name, cat: cats.get(p.category) ?? "" }));
  // Codes only: the desk never ships maker names to the browser.
  const suppliers = getSuppliers().map((s) => s.code);
  return <Desk parts={parts} suppliers={suppliers} />;
}
