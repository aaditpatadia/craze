/**
 * Content validation. Runs before every build (npm run build) and on its own with
 * `npm run validate`. Exits non-zero on any error, which fails the build.
 *
 * Schema rules (in lib/schema.ts) already enforce: every evidence item has a date,
 * a checker and a stated limit; tier 2 lists measurements; tier 3 attaches a report;
 * illustrative manifests carry the disclaimer. This script adds the cross-file rules.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadRawContent } from "../lib/content";
import { ORIGIN_NOT_VERIFIED, ORIGIN_UNKNOWN, type Evidence, type Product } from "../lib/schema";

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

let raw;
try {
  raw = loadRawContent();
} catch (e) {
  console.error(`\nContent failed schema validation:\n${(e as Error).message}\n`);
  process.exit(1);
}

const { categories, suppliers, products, manifests } = raw;
const today = new Date().toISOString().slice(0, 10);
const publicDir = join(process.cwd(), "public");

const unique = (label: string, ids: string[]) => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) err(`duplicate ${label} id "${id}"`);
    seen.add(id);
  }
};
unique("category", categories.map((c) => c.id));
unique("supplier", suppliers.map((s) => s.id));
unique("product", products.map((p) => p.id));

const checkDate = (where: string, date: string | null) => {
  if (date && date > today) err(`${where}: date ${date} is in the future`);
};

const checkPublicFile = (where: string, url: string | null) => {
  if (!url || /^https?:\/\//.test(url)) return;
  if (!existsSync(join(publicDir, url))) err(`${where}: file not found in /public: ${url}`);
};

const checkEvidence = (where: string, e: Evidence) => {
  checkDate(`${where} evidence ${e.id}`, e.date);
  checkPublicFile(`${where} evidence ${e.id}`, e.documentUrl);
  for (const d of e.documents) {
    checkDate(`${where} evidence ${e.id} document "${d.title}"`, d.received);
    checkPublicFile(`${where} evidence ${e.id}`, d.url);
  }
};

for (const c of categories) {
  if (c.status === "upcoming" && c.whyItMatters.trim().length < 10) err(`category ${c.id}: upcoming categories need a "why it matters" line`);
}

for (const p of products) {
  const where = `product ${p.id}`;
  const cat = categories.find((c) => c.id === p.category);
  if (!cat) err(`${where}: unknown category "${p.category}"`);
  else if (cat.status === "upcoming" && p.status === "live") err(`${where}: live product in upcoming category "${cat.id}"`);
  const sup = suppliers.find((s) => s.id === p.supplierId);
  if (!sup) err(`${where}: unknown supplier "${p.supplierId}"`);
  else if (!sup.parts.includes(p.id)) err(`${where}: supplier ${sup.id} does not list this product in its parts[]`);
  if (p.evidence.length === 0) err(`${where}: no evidence block`);
  checkDate(where, p.lastVerified);

  const allEv = [...p.evidence, ...p.parts.flatMap((pt) => pt.evidence)];
  unique(`${where} evidence`, allEv.map((e) => e.id));
  allEv.forEach((e) => checkEvidence(where, e));
  const evIds = new Set(allEv.map((e) => e.id));
  const needEvidence = (w: string, id: string | null) => {
    if (!id) err(`${w}: claim has no evidence reference`);
    else if (!evIds.has(id)) err(`${w}: evidence "${id}" does not exist on this product`);
  };

  p.specs.forEach((s) => needEvidence(`${where} spec ${s.key}`, s.evidenceId));
  const knownOrigin = (c: string) => c !== ORIGIN_UNKNOWN && c !== ORIGIN_NOT_VERIFIED;
  if (knownOrigin(p.origin.country)) needEvidence(`${where} origin`, p.origin.evidenceId);

  unique(`${where} part`, p.parts.map((pt) => pt.id));
  const partIds = new Set(p.parts.map((pt) => pt.id));
  for (const pt of p.parts) {
    const pw = `${where} part ${pt.id}`;
    pt.specs.forEach((s) => needEvidence(`${pw} spec ${s.key}`, s.evidenceId));
    if (knownOrigin(pt.originCountry)) needEvidence(`${pw} origin`, pt.originEvidenceId);
    if (pt.grade !== null) needEvidence(`${pw} grade`, pt.gradeEvidenceId);
    if (pt.grade === null && pt.gradeEvidenceId) warn(`${pw}: gradeEvidenceId set but grade is null`);
    for (const n of pt.interactsWith) if (!partIds.has(n)) err(`${pw}: interactsWith unknown part "${n}"`);
  }
  if (p.parts.length === 0 && !p.partsNote) warn(`${where}: no parts and no partsNote; the page will use a generic message`);

  for (const ph of p.photos) {
    checkDate(`${where} photo`, ph.takenOn);
    checkPublicFile(`${where} photo`, ph.src);
  }
  if (p.photoSpin) {
    checkDate(`${where} photoSpin`, p.photoSpin.capturedOn);
    p.photoSpin.frames.forEach((f) => checkPublicFile(`${where} photoSpin`, f));
  }

  const m = manifests[p.id];
  if (m) {
    const mw = `manifest ${p.id}`;
    if (p.modelSource !== m.modelSource) {
      warn(`${mw}: product modelSource "${p.modelSource}" differs from manifest "${m.modelSource}". The manifest is used.`);
    }
    if (m.assembledGlb) checkPublicFile(mw, m.assembledGlb);
    const mIds = new Set(m.parts.map((mp) => mp.id));
    for (const mp of m.parts) {
      const content = p.parts.find((pt) => pt.id === mp.id);
      if (!content) {
        err(`${mw}: part "${mp.id}" has no matching part in content/products/${p.id}.json`);
        continue;
      }
      if ([...mp.layers].sort().join() !== [...content.layers].sort().join()) {
        err(`${mw}: part "${mp.id}" layers [${mp.layers}] differ from content [${content.layers}]`);
      }
      if (mp.order !== content.explode.order) err(`${mw}: part "${mp.id}" order ${mp.order} differs from content ${content.explode.order}`);
      if (mp.parent && !mIds.has(mp.parent)) err(`${mw}: part "${mp.id}" parent "${mp.parent}" not in manifest`);
      checkPublicFile(`${mw} part ${mp.id}`, mp.glb);
      checkPublicFile(`${mw} part ${mp.id}`, mp.glbDetail);
    }
    for (const pt of p.parts) if (!mIds.has(pt.id)) warn(`${mw}: content part "${pt.id}" has no 3D model; it will appear in the list only`);
  } else if (p.modelSource === "illustrative" || p.modelSource === "supplier-cad") {
    err(`${where}: modelSource "${p.modelSource}" but no manifest at public/assets/models/${p.id}/manifest.json`);
  }
}

// Timule codes: one code per product, its letters match the category, and the URL id follows the code.
unique("part code", products.map((p) => p.code));
unique("supplier code", suppliers.map((s) => s.code));
unique("category code", categories.map((c) => c.code));
for (const p of products) {
  const cat = categories.find((c) => c.id === p.category);
  const segment = p.code.split("-")[1];
  if (cat && segment !== cat.code) err(`product ${p.id}: code ${p.code} should start TM-${cat.code}- for category ${cat.id}`);
  const expectedId = p.code.toLowerCase().replace(/-[a-z]$/, "");
  if (p.id !== expectedId) err(`product ${p.id}: id should be "${expectedId}" to match code ${p.code}`);
  if (p.status === "live" && !raw.sourcing.some((s) => s.productId === p.id)) warn(`product ${p.id}: no sourcing record in content/sourcing.json`);
}
for (const s of raw.sourcing) {
  if (!products.some((p) => p.id === s.productId)) err(`sourcing ${s.productId}: no product with this id`);
  checkDate(`sourcing ${s.productId}`, s.updated);
  if (s.status !== "searching" && s.candidates.length === 0) err(`sourcing ${s.productId}: status "${s.status}" needs at least one candidate`);
}

for (const m of Object.values(manifests)) {
  if (!products.some((p) => p.id === m.productId)) err(`manifest ${m.productId}: no product with this id`);
}

for (const s of suppliers) {
  const where = `supplier ${s.id}`;
  checkDate(where, s.lastVerified);
  s.documentsReceived.forEach((d) => checkDate(`${where} document "${d.title}"`, d.received));
  for (const pid of s.parts) if (!products.some((p) => p.id === pid)) err(`${where}: lists unknown product "${pid}"`);
  if (s.sampleReceived.received && !s.sampleReceived.date) err(`${where}: sample received but no date`);
  if (s.factoryChecked.status !== "not-checked" && (!s.factoryChecked.date || !s.factoryChecked.by)) {
    err(`${where}: factory check needs a date and who checked`);
  }
  if (s.leadTimeDays.min > s.leadTimeDays.max) err(`${where}: lead time min is greater than max`);
}

const placeholders = [...products, ...suppliers].filter((x) => !x.placeholder);
if (placeholders.length > 0) {
  warn(`${placeholders.length} record(s) are marked as real data (placeholder: false). Make sure every claim in them is genuine.`);
}

// Copy rules: banned phrases and em dashes, in content and source.
const BANNED = [
  /guaranteed compliant/i,
  /certified by us/i,
  /best[- ]in[- ]class/i,
  /world[- ]class/i,
  /industry[- ]leading/i,
  /cutting[- ]edge/i,
  /revolutionary/i,
  /military[- ]grade/i,
];
const EM_DASH = "—";
const SCAN_DIRS = ["content", "app", "components", "lib", "scripts", "public/assets", "public/documents"];
const SCAN_EXT = /\.(tsx?|json|mdx?|css|txt)$/;
const SELF = relative(process.cwd(), __filename).replace(/\\/g, "/");

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const full = join(dir, f);
    return statSync(full).isDirectory() ? walk(full) : SCAN_EXT.test(f) ? [full] : [];
  });
}
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(process.cwd(), dir))) {
    const rel = relative(process.cwd(), file).replace(/\\/g, "/");
    if (rel === SELF) continue;
    const text = readFileSync(file, "utf8");
    if (text.includes(EM_DASH)) err(`${rel}: contains an em dash. Use a comma, colon or full stop instead.`);
    for (const re of BANNED) if (re.test(text)) err(`${rel}: contains banned phrase matching ${re}`);
  }
}

const productCount = products.length;
const partCount = products.reduce((n, p) => n + p.parts.length, 0);
const evCount = products.reduce((n, p: Product) => n + p.evidence.length + p.parts.reduce((k, pt) => k + pt.evidence.length, 0), 0);

if (warnings.length) {
  console.warn(`\nContent warnings (${warnings.length}):`);
  warnings.forEach((w) => console.warn(`  - ${w}`));
}
if (errors.length) {
  console.error(`\nContent validation failed with ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`  x ${e}`));
  console.error("");
  process.exit(1);
}
console.log(
  `\nContent OK: ${categories.length} categories, ${suppliers.length} suppliers, ${productCount} products, ${partCount} parts, ${evCount} evidence records, ${Object.keys(manifests).length} model manifests.\n`,
);
