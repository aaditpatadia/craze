import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { CERT_FILE } from "@/lib/forms";
import { clientIp, rateLimited } from "@/lib/submissions";
import { readJson, sameOrigin } from "@/lib/security";

export const runtime = "nodejs";

/**
 * Issues short-lived tokens so a supplier's browser can upload certificates straight
 * to Vercel Blob. Needs BLOB_READ_WRITE_TOKEN, which Vercel adds when a Blob store is
 * connected to the project. Files land under certificates/ with a random suffix.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Uploads are not set up yet. Paste a link to your certificates instead." }, { status: 503 });
  }
  if (rateLimited(`upload:${clientIp(request)}`, 20)) {
    return NextResponse.json({ error: "Too many uploads. Please wait a minute." }, { status: 429 });
  }
  const body = (await readJson(request, 8 * 1024)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "The upload request could not be read." }, { status: 400 });
  // Only our own pages may ask for an upload token. Vercel's completion callback is signed and checked by handleUpload.
  if (body.type === "blob.generate-client-token" && !sameOrigin(request)) {
    return NextResponse.json({ error: "This request did not come from timule.com." }, { status: 403 });
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^certificates\/[\w.-]{1,160}$/.test(pathname)) throw new Error("Wrong upload path.");
        return {
          allowedContentTypes: [...CERT_FILE.types],
          maximumSizeInBytes: CERT_FILE.maxBytes,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
