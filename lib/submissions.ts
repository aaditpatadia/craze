/**
 * Where form submissions go. Server only.
 * - If RESEND_API_KEY and SUBMISSIONS_EMAIL_TO are set, each submission is emailed via Resend.
 * - Otherwise it is appended to a JSON Lines file: .data/submissions.jsonl locally, or
 *   /tmp on Vercel (temporary storage, fine for previews, not for production).
 */
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type Submission = { kind: "request" | "notify"; data: Record<string, unknown> };

const dir = process.env.VERCEL ? "/tmp" : join(process.cwd(), ".data");

export async function storeSubmission(s: Submission): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const record = { id, receivedAt: new Date().toISOString(), ...s };
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SUBMISSIONS_EMAIL_TO;
  if (key && to) {
    const from = process.env.SUBMISSIONS_EMAIL_FROM ?? "Catalogue <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: s.kind === "request" ? `Sourcing request from ${String(s.data.company ?? "unknown")}` : `Notify me: ${String(s.data.category ?? "")}`,
        text: JSON.stringify(record, null, 2),
        ...(typeof s.data.email === "string" && s.kind === "request" ? { reply_to: s.data.email } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    return { id };
  }
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, "submissions.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  return { id };
}

/** Small in-memory rate limit per IP. Resets when the server instance restarts. */
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}
