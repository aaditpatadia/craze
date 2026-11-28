/**
 * A small record store for things that must outlive a single request: the verification log,
 * letters of intent and request tracking. Server only.
 *
 * On Vercel it uses the connected Blob store (BLOB_READ_WRITE_TOKEN). Records are written as
 * private blobs when the store allows it; on a public store they get a random suffix so their
 * URL cannot be guessed, and nothing ever links to them. Locally, records go to .data/store.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { del, get, list, put } from "@vercel/blob";

type Access = "private" | "public";
let access: Access | null = null;

const blobOn = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const localDir = join(process.cwd(), ".data", "store");

const SAFE = /^[a-z]+\/[A-Za-z0-9._-]{1,120}\.json$/;

async function putBlob(path: string, body: string) {
  const opts = { contentType: "application/json", allowOverwrite: true, cacheControlMaxAge: 60 } as const;
  if (access !== "public") {
    try {
      await put(path, body, { ...opts, access: "private", addRandomSuffix: false });
      access = "private";
      return;
    } catch (e) {
      if (access === "private") throw e;
    }
  }
  // Public store: never let a record's URL be guessable, so drop the old copy and write with a random suffix.
  const { pathname } = await put(path, body, { ...opts, access: "public", addRandomSuffix: true });
  access = "public";
  // Remove the older copies, so a record exists once and storage does not grow with every edit.
  try {
    const stem = path.slice(0, -5);
    const { blobs } = await list({ prefix: stem, limit: 100 });
    const old = blobs.filter((b) => b.pathname !== pathname && isCopy(stem, b.pathname));
    if (old.length) await del(old.map((b) => b.url));
  } catch (e) {
    console.error("[store] could not prune old copies", e);
  }
}

/** True when `p` is `stem.json` or `stem-<random suffix>.json`. Ids contain only [a-z0-9-], so the stem needs no escaping. */
const isCopy = (stem: string, p: string) => p === `${stem}.json` || (p.startsWith(`${stem}-`) && /^[A-Za-z0-9]{20,}\.json$/.test(p.slice(stem.length + 1)));

/** Writes (or replaces) one record. `path` is like "loi/TMR-ABC123.json". */
export async function saveRecord(path: string, record: unknown): Promise<void> {
  if (!SAFE.test(path)) throw new Error("Bad record path.");
  const body = JSON.stringify(record);
  if (blobOn()) return putBlob(path, body);
  const file = join(localDir, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body, "utf8");
}

/** Removes a record, including every copy a public store may hold. */
export async function deleteRecord(path: string): Promise<void> {
  if (!SAFE.test(path)) throw new Error("Bad record path.");
  if (blobOn()) {
    const stem = path.slice(0, -5);
    const { blobs } = await list({ prefix: stem, limit: 100 });
    const mine = blobs.filter((b) => isCopy(stem, b.pathname));
    if (mine.length) await del(mine.map((b) => b.url));
    return;
  }
  const { rm } = await import("node:fs/promises");
  await rm(join(localDir, path), { force: true });
}

async function readBlob(pathname: string, url: string): Promise<unknown> {
  for (const a of (access ? [access] : ["private", "public"]) as Access[]) {
    try {
      const r = await get(a === "public" ? url : pathname, { access: a, useCache: false });
      if (r && r.statusCode === 200 && r.stream) {
        access = a;
        return JSON.parse(await new Response(r.stream).text());
      }
    } catch {
      /* try the other access mode */
    }
  }
  return null;
}

/** Every record under a prefix such as "loi/", newest first. Unreadable records are skipped. */
export async function listRecords<T>(prefix: string, limit = 500): Promise<T[]> {
  if (!/^[a-z]+\/$/.test(prefix)) throw new Error("Bad prefix.");
  if (blobOn()) {
    try {
      const { blobs } = await list({ prefix, limit });
      // With random suffixes a record can exist more than once; keep the newest copy of each.
      const newest = new Map<string, (typeof blobs)[number]>();
      for (const b of blobs) {
        const key = b.pathname.replace(/-[A-Za-z0-9]{20,}(?=\.json$)/, "");
        const prev = newest.get(key);
        if (!prev || new Date(b.uploadedAt) > new Date(prev.uploadedAt)) newest.set(key, b);
      }
      const rows = await Promise.all([...newest.values()].map((b) => readBlob(b.pathname, b.url)));
      return sortNewest(rows.filter(Boolean) as T[]);
    } catch (e) {
      console.error("[store] list failed", e);
      return [];
    }
  }
  try {
    const dir = join(localDir, prefix);
    const files = await readdir(dir);
    const rows = await Promise.all(files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await readFile(join(dir, f), "utf8")) as T));
    return sortNewest(rows);
  } catch {
    return [];
  }
}

/** One record by its path, or null. */
export async function getRecord<T>(path: string): Promise<T | null> {
  if (!SAFE.test(path)) return null;
  const prefix = path.slice(0, path.indexOf("/") + 1);
  const id = path.slice(prefix.length, -5);
  const rows = await listRecords<T & { id?: string }>(prefix);
  return (rows.find((r) => r.id === id) as T | undefined) ?? null;
}

function sortNewest<T>(rows: T[]): T[] {
  const at = (r: unknown) => String((r as { updatedAt?: string; createdAt?: string }).updatedAt ?? (r as { createdAt?: string }).createdAt ?? "");
  return rows.sort((a, b) => at(b).localeCompare(at(a)));
}

/** A random, unguessable id for links that act as a key, such as tracking pages. */
export function secretId(bytes = 16): string {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
