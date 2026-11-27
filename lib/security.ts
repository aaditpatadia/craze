/**
 * Shared checks for every API route that takes a form or JSON from a browser.
 *  - CSRF: a browser request must come from this site (Origin or Sec-Fetch-Site), so another
 *    site cannot submit forms or use a signed-in founder's session on our behalf.
 *  - JSON only, with a size cap, so nobody can send megabytes to a form endpoint.
 *  - Rate limit per IP address.
 * Server only.
 */
import { NextResponse } from "next/server";
import { clientIp, rateLimited } from "./submissions";

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  // Browsers always send one of these on a cross-site POST. Tools like curl send neither and carry no one's cookies.
  if (site) return site === "same-origin" || site === "none";
  return true;
}

type Guard = { key: string; limit?: number; maxBytes?: number };

/** Returns an error response to send, or null when the request may go ahead. */
export function guard(req: Request, { key, limit = 5, maxBytes = 64 * 1024 }: Guard): NextResponse | null {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "This request did not come from timule.com." }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 415 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return NextResponse.json({ ok: false, error: "That request is too large." }, { status: 413 });
  if (rateLimited(`${key}:${clientIp(req)}`, limit)) return NextResponse.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  return null;
}

/** Reads a JSON body with a hard size cap, whatever Content-Length claimed. */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A string field, trimmed of control characters and cut to a maximum length. */
export const text = (v: unknown, max = 500): string =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .slice(0, max)
    : "";
