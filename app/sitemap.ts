import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { getCategories, getProducts, getSuppliers, supplierSlug } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE.url}${p}`;
  const fixed = ["", "/investors", "/parts", "/sectors", "/codes", "/bom", "/request", "/suppliers/join", "/methodology", "/about", "/upcoming", "/codes/register", "/configure", "/configure/motor", "/configure/esc", "/configure/propeller", "/tools", "/tools/content", "/tools/sizing", "/tools/files", "/tools/firmware", "/brief/buyers", "/brief/suppliers"].map((p) => ({ url: u(p) }));
  return [
    ...fixed,
    ...getCategories()
      .filter((c) => c.status === "live")
      .map((c) => ({ url: u(`/categories/${c.id}`) })),
    ...getProducts().map((p) => ({ url: u(`/parts/${p.id}`), lastModified: p.lastVerified })),
    ...getProducts().map((p) => ({ url: u(`/sheets/${p.id}`), lastModified: p.lastVerified })),
    ...getSuppliers().map((s) => ({ url: u(`/suppliers/${supplierSlug(s)}`), lastModified: s.lastVerified })),
  ];
}
