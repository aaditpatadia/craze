// Quick check of BOM matching against the real catalogue: npx tsx scripts/test-bom.ts
import { SAMPLE_BOM, matchRows, parseDelimited, toBomRows } from "../lib/bom";
import { loadRawContent } from "../lib/content";

const { products, categories, suppliers } = loadRawContent();
const catalog = products.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  categoryName: categories.find((c) => c.id === p.category)?.name ?? "",
  supplierId: p.supplierId,
  supplierName: suppliers.find((s) => s.id === p.supplierId)?.name ?? "",
  summary: p.summary,
  placeholder: p.placeholder,
  modelSource: p.modelSource,
  specs: p.specs.map((s) => ({ ...s, tier: 1 as const })),
  originCountry: p.origin.country,
  originTier: null,
  highestTier: 1 as const,
  keywords: p.keywords,
  lastVerified: p.lastVerified,
  partCount: p.parts.length,
}));
for (const m of matchRows(toBomRows(parseDelimited(SAMPLE_BOM)), catalog)) {
  console.log(`${m.row.part.padEnd(36)} -> ${m.item?.id ?? "NO MATCH"} (${m.confidence ?? "-"}, ${m.score})`);
}
