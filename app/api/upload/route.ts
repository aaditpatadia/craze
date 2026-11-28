import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { supplierFrom, teamFrom } from "@/lib/auth";
import { CERT_FILE } from "@/lib/forms";
import { VAULT_FILE } from "@/lib/portal";
import { clientIp, rateLimited } from "@/lib/submissions";
import { readJson, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

const COMPLAINT_FILE = { types: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "video/mp4", "video/quicktime"], maxBytes: 25 * 1024 * 1024 };

/**
 * Issues short-lived tokens so a browser can upload straight to Vercel Blob (files never pass
 * through our functions, so there is no 4.5 MB limit). Three places accept uploads:
 *   certificates/...          the public supplier application form
 *   complaints/...            the public complaint form
 *   vault/<supplier id>/...   the supplier portal: only that supplier, or a signed-in team member
 * Every file gets a random suffix, so its address cannot be guessed, and nothing links to it.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Uploads are not set up yet. Paste a link to your files instead." }, { status: 503 });
  }
  if (rateLimited(`upload:${clientIp(request)}`, 40)) {
    return NextResponse.json({ error: "Too many uploads. Please wait a minute." }, { status: 429 });
  }
  const body = (await readJson(request, 8 * 1024)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "The upload request could not be read." }, { status: 400 });
  // Only our own pages may ask for an upload token. Vercel's completion callback is signed and checked by handleUpload.
  if (body.type === "blob.generate-client-token" && !sameOrigin(request)) {
    return NextResponse.json({ error: "This request did not come from timule.com." }, { status: 403 });
  }
  const [team, supplier] = await Promise.all([teamFrom(request), supplierFrom(request)]);
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const token = (types: readonly string[], maxBytes: number) => ({
          allowedContentTypes: [...types],
          maximumSizeInBytes: maxBytes,
          addRandomSuffix: true,
          validUntil: Date.now() + 15 * 60 * 1000,
        });
        if (/^certificates\/[\w.-]{1,160}$/.test(pathname)) return token(CERT_FILE.types, CERT_FILE.maxBytes);
        if (/^complaints\/[\w.-]{1,160}$/.test(pathname)) return token(COMPLAINT_FILE.types, COMPLAINT_FILE.maxBytes);
        const vault = /^vault\/([a-f0-9]{16})\/[\w.-]{1,160}$/.exec(pathname);
        if (vault) {
          const sid = vault[1];
          if (!team && supplier?.sid !== sid) throw new Error("Sign in to upload.");
          return token(VAULT_FILE.types, VAULT_FILE.maxBytes);
        }
        throw new Error("Wrong upload path.");
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
