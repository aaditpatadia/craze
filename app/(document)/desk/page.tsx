import type { Metadata } from "next";
import { Desk } from "@/components/blueprint/Desk";
import { getCategories, getProducts, getSuppliers } from "@/lib/content";
import { requireFounder } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Desk: quotations, purchase orders and invoices",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeskPage() {
  await requireFounder("/desk");
  const cats = new Map(getCategories().map((c) => [c.id, c.code]));
  const parts = getProducts().map((p) => ({ code: p.code, name: p.name, cat: cats.get(p.category) ?? "" }));
  // Codes only: the desk never ships maker names to the browser.
  const suppliers = getSuppliers().map((s) => s.code);
  return <Desk parts={parts} suppliers={suppliers} />;
}
