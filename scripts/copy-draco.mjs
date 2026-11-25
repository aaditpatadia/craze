// Copies the Draco glTF decoder from three into /public/draco so models decode
// without calling a third-party CDN. Runs on postinstall.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf");
const dest = join(process.cwd(), "public", "draco");

if (!existsSync(src)) {
  console.warn("[copy-draco] three not installed yet, skipping.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-draco] Draco decoder copied to public/draco");
