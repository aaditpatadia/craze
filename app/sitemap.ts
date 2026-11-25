import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { getCategories, getProducts, getSuppliers } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE.url}${p}`;
  const fixed = ["", "/parts", "/bom", "/request", "/methodology", "/about", "/upcoming"].map((p) => ({ url: u(p) }));
  return [
    ...fixed,
    ...getCategories()
      .filter((c) => c.status === "live")
      .map((c) => ({ url: u(`/categories/${c.id}`) })),
    ...getProducts().map((p) => ({ url: u(`/parts/${p.id}`), lastModified: p.lastVerified })),
    ...getSuppliers().map((s) => ({ url: u(`/suppliers/${s.id}`), lastModified: s.lastVerified })),
  ];
}
