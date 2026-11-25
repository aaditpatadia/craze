/**
 * Build-time content loader. Reads /content and model manifests from disk, parses
 * them with the Zod schemas and applies USE_PLACEHOLDER_DATA. Server only.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { USE_PLACEHOLDER_DATA } from "./config";
import {
  CategorySchema,
  ManifestSchema,
  ProductSchema,
  SupplierSchema,
  type Category,
  type Evidence,
  type Manifest,
  type Product,
  type Supplier,
  type Tier,
} from "./schema";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const MODELS = join(ROOT, "public", "assets", "models");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export type RawContent = {
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  manifests: Record<string, Manifest>;
};

/** Parses everything without filtering. Throws with a readable message on schema errors. */
export function loadRawContent(): RawContent {
  const categories = CategorySchema.array().parse(readJson(join(CONTENT, "categories.json")));
  const suppliers = SupplierSchema.array().parse(readJson(join(CONTENT, "suppliers.json")));
  const productDir = join(CONTENT, "products");
  const products = readdirSync(productDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const parsed = ProductSchema.safeParse(readJson(join(productDir, f)));
      if (!parsed.success) {
        throw new Error(`content/products/${f}:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
      }
      return parsed.data;
    });
  const manifests: Record<string, Manifest> = {};
  if (existsSync(MODELS)) {
    for (const dir of readdirSync(MODELS)) {
      const file = join(MODELS, dir, "manifest.json");
      if (!existsSync(file)) continue;
      const parsed = ManifestSchema.safeParse(readJson(file));
      if (!parsed.success) {
        throw new Error(`public/assets/models/${dir}/manifest.json:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
      }
      manifests[parsed.data.productId] = parsed.data;
    }
  }
  return { categories, suppliers, products, manifests };
}

const visible = <T extends { placeholder: boolean }>(items: T[]) =>
  USE_PLACEHOLDER_DATA ? items : items.filter((i) => !i.placeholder);

export const getContent = cache(() => {
  const raw = loadRawContent();
  const products = visible(raw.products)
    .filter((p) => raw.categories.some((c) => c.id === p.category))
    .map((p) => {
      // The manifest describes the model actually shown, so it wins.
      const manifest = raw.manifests[p.id];
      return manifest ? { ...p, modelSource: manifest.modelSource } : p;
    });
  return {
    categories: [...raw.categories].sort((a, b) => a.order - b.order),
    suppliers: visible(raw.suppliers),
    products,
    manifests: raw.manifests,
  };
});

export const getCategories = () => getContent().categories;
export const getLiveCategories = () => getCategories().filter((c) => c.status === "live");
export const getUpcomingCategories = () => getCategories().filter((c) => c.status === "upcoming");
export const getCategory = (id: string) => getCategories().find((c) => c.id === id);
export const getProducts = () => getContent().products;
export const getProduct = (id: string) => getProducts().find((p) => p.id === id);
export const getProductsInCategory = (id: string) => getProducts().filter((p) => p.category === id);
export const getSuppliers = () => getContent().suppliers;
export const getSupplier = (id: string) => getSuppliers().find((s) => s.id === id);
export const getManifest = (productId: string): Manifest | undefined => getContent().manifests[productId];

/** Looks an evidence id up on the product and all of its parts. */
export function findEvidence(product: Product, evidenceId: string | null): Evidence | undefined {
  if (!evidenceId) return undefined;
  return (
    product.evidence.find((e) => e.id === evidenceId) ??
    product.parts.flatMap((p) => p.evidence).find((e) => e.id === evidenceId)
  );
}

export function allEvidence(product: Product): Evidence[] {
  return [...product.evidence, ...product.parts.flatMap((p) => p.evidence)];
}

export function highestTier(product: Product): Tier {
  return allEvidence(product).reduce<Tier>((max, e) => (e.tier > max ? e.tier : max), 1);
}

/** Slim, serialisable product record for client components (catalogue, BOM checker). */
export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  summary: string;
  placeholder: boolean;
  modelSource: Product["modelSource"];
  specs: { key: string; label: string; value: number | string; unit: string | null; tier: Tier }[];
  originCountry: string;
  originTier: Tier | null;
  highestTier: Tier;
  keywords: string[];
  lastVerified: string;
  partCount: number;
};

export function toCatalogItem(p: Product): CatalogItem {
  const cat = getCategory(p.category);
  const sup = getSupplier(p.supplierId);
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    categoryName: cat?.name ?? p.category,
    supplierId: p.supplierId,
    supplierName: sup?.name ?? "Supplier not listed",
    summary: p.summary,
    placeholder: p.placeholder,
    modelSource: p.modelSource,
    specs: p.specs.map((s) => ({ key: s.key, label: s.label, value: s.value, unit: s.unit, tier: findEvidence(p, s.evidenceId)?.tier ?? 1 })),
    originCountry: p.origin.country,
    originTier: findEvidence(p, p.origin.evidenceId)?.tier ?? null,
    highestTier: highestTier(p),
    keywords: p.keywords,
    lastVerified: p.lastVerified,
    partCount: p.parts.length,
  };
}

export const getCatalog = () => getProducts().filter((p) => p.status === "live").map(toCatalogItem);
