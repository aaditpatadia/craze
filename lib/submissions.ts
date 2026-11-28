/**
 * Where form submissions go. Server only.
 * - By default each submission is posted to the Formspree form in SITE.formEndpoint,
 *   which emails it to SITE.contactEmail. Set FORMSPREE_ENDPOINT="off" to skip it.
 * - Else, if RESEND_API_KEY and SUBMISSIONS_EMAIL_TO are set, each submission is emailed via Resend.
 * - Otherwise it is appended to a JSON Lines file: .data/submissions.jsonl locally, or
 *   /tmp on Vercel (temporary storage, fine for previews, not for production).
 */
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/config";

export type Submission = { kind: "request" | "notify" | "supplier" | "investor" | "loi" | "complaint" | "portal"; data: Record<string, unknown>; reference?: string };

const SUBJECT: Record<Submission["kind"], (s: Submission) => string> = {
  request: (s) => `${s.reference ?? "Request"}: sourcing request from ${String(s.data.company ?? "unknown")}`,
  notify: (s) => `Notify me: ${String(s.data.category ?? "")}`,
  supplier: (s) => `${s.reference ?? "Application"}: supplier application from ${String(s.data.company ?? "unknown")}`,
  investor: (s) => `${s.reference ?? "Investor"}: investor enquiry from ${String(s.data.name ?? "")}, ${String(s.data.firm ?? "")}`,
  complaint: (s) => `${s.reference ?? "Complaint"}: customer complaint from ${String(s.data.company ?? "unknown")}`,
  portal: (s) => `${s.reference ?? "Portal"}: ${String(s.data.subject ?? "supplier portal update")}`,
  loi: (s) => `${s.reference ?? "LOI"}: letter of intent from ${String(s.data.company ?? "unknown")}`,
};

const dir = process.env.VERCEL ? "/tmp" : join(process.cwd(), ".data");

export async function storeSubmission(s: Submission): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const record = { id, receivedAt: new Date().toISOString(), ...s };
  if (SITE.formEndpoint && SITE.formEndpoint !== "off") {
    const fields = Object.fromEntries(
      Object.entries(s.data).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
    );
    const res = await fetch(SITE.formEndpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        _subject: SUBJECT[s.kind](s),
        form: s.kind,
        reference: s.reference ?? id,
        ...fields,
        ...(typeof s.data.email === "string" ? { _replyto: s.data.email } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Formspree responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return { id };
  }
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SUBMISSIONS_EMAIL_TO;
  if (key && to) {
    const from = process.env.SUBMISSIONS_EMAIL_FROM ?? "Timule <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: SUBJECT[s.kind](s),
        text: JSON.stringify(record, null, 2),
        ...(typeof s.data.email === "string" && s.kind !== "notify" ? { reply_to: s.data.email } : {}),
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
