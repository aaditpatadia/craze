import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { supplierFrom, teamFrom } from "@/lib/auth";

export const runtime = "nodejs";

const BLOB = /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\/(certificates|complaints|vault)\/([^?#]+)$/i;

/**
 * Serves an uploaded file to the people allowed to see it, and nobody else:
 *  - team members: every file;
 *  - a supplier: only the files in their own vault.
 * Files are streamed through this route, so the storage address never appears in a page.
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  const m = BLOB.exec(u);
  if (!m) return new NextResponse("Not found", { status: 404 });
  const [team, supplier] = await Promise.all([teamFrom(req), supplierFrom(req)]);
  const area = m[2]!.toLowerCase();
  const rest = m[3]!;
  const allowed = !!team || (area === "vault" && !!supplier && rest.startsWith(`${supplier.sid}/`));
  if (!allowed) return new NextResponse("Sign in to see this file.", { status: 403 });

  const access = m[1]!.toLowerCase() as "public" | "private";
  try {
    const r = await get(u, { access, useCache: true });
    if (!r || r.statusCode !== 200 || !r.stream) return new NextResponse("Not found", { status: 404 });
    const name = decodeURIComponent(rest.split("/").pop() ?? "file").replace(/[^\w.-]/g, "_");
    const download = new URL(req.url).searchParams.get("download") === "1";
    return new NextResponse(r.stream, {
      headers: {
        "Content-Type": r.blob.contentType || "application/octet-stream",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
        "Cache-Control": "private, max-age=300",
        // A file can never run scripts in our pages.
        "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (e) {
    console.error("[files] read failed", e);
    return new NextResponse("Could not read the file.", { status: 502 });
  }
}
