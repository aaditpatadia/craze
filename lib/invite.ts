/**
 * The invitation a new supplier receives. One source for the automatic email (when RESEND_API_KEY
 * is set) and for the ready-written Gmail draft the team can send with one click.
 */
import { SITE } from "./config";
import type { SupplierAccount } from "./portal";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Sign-in link that pre-selects the invited Google account. */
export const inviteLink = (email: string) => `${SITE.url}/supplier/login?email=${encodeURIComponent(email)}`;

export function invitation(a: Pick<SupplierAccount, "company" | "code" | "emails" | "meeting">, by?: string) {
  const email = a.emails[0] ?? "";
  const link = inviteLink(email);
  const subject = `Welcome to Timule: your supplier portal is ready (${a.code})`;
  const meeting = a.meeting ? `Our onboarding meeting is on ${when(a.meeting)} IST. We will go through the portal together.` : "";
  const lines = [
    `Hello ${a.company} team,`,
    "",
    `You are invited to the Timule supplier portal. Your supplier code is ${a.code}. Buyers see this code and the evidence recorded against it, never your company name.`,
    "",
    "To start:",
    `1. Open ${link}`,
    `2. Click "Continue with Google" and choose ${a.emails.join(" or ")}. No password to create.`,
    "3. Fill in your company profile (GSTIN required) and accept the supplier terms.",
    "4. Upload each item on your onboarding checklist. You will see our review and any requests from us on your dashboard.",
    "",
    "Please keep ready:",
    "- GST certificate and Udyam or incorporation certificate",
    "- Quality certificates (ISO 9001 or others you hold)",
    "- At least 4 recent photos of your factory, assembly line and test bench",
    "- Photos and datasheets of the parts you make",
    "- Test proof: photos or a short video of units on the test bench with readings visible",
    "- Where your magnets, copper, bearings, chips and PCBs come from",
    "",
    meeting,
    meeting ? "" : null,
    `Questions? Reply to this email or write to ${SITE.contactEmail} and quote ${a.code}.`,
    "",
    "Welcome aboard,",
    by ? `${by}, Timule` : "The Timule team",
    SITE.url.replace(/^https?:\/\//, ""),
  ].filter((l): l is string => l !== null);
  const text = lines.join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px">
<tr><td style="background:#18181b;color:#fafafa;padding:24px 28px;border-radius:12px 12px 0 0">
<div style="font-size:13px;letter-spacing:.2em;font-weight:bold">TIMULE</div>
<div style="font-size:12px;letter-spacing:.15em;opacity:.7;margin-top:6px">SUPPLIER PORTAL</div></td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:22px;margin:0 0 12px">Welcome, ${esc(a.company)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 16px">You are invited to the Timule supplier portal. Your supplier code is <b style="font-family:monospace">${esc(a.code)}</b>. Buyers see this code and the evidence recorded against it, never your company name.</p>
<p style="margin:24px 0"><a href="${link}" style="background:#18181b;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:bold;font-size:15px;display:inline-block">Open your supplier dashboard</a></p>
<p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 16px">Click <b>Continue with Google</b> and choose <b>${esc(a.emails.join(" or "))}</b>. There is no password to create.</p>
${meeting ? `<p style="font-size:14px;line-height:1.6;background:#f4f4f5;border-radius:8px;padding:12px 14px;margin:0 0 16px">${esc(meeting)}</p>` : ""}
<p style="font-size:14px;font-weight:bold;margin:20px 0 8px">Please keep ready</p>
<ul style="font-size:14px;line-height:1.7;color:#3f3f46;margin:0;padding-left:20px">
<li>GST certificate and Udyam or incorporation certificate</li><li>Quality certificates you hold (ISO 9001 or others)</li>
<li>At least 4 recent photos of your factory, assembly line and test bench</li><li>Photos and datasheets of the parts you make</li>
<li>Test proof: photos or a short video of units on the test bench with readings visible</li><li>Where your magnets, copper, bearings, chips and PCBs come from</li></ul>
<p style="font-size:14px;line-height:1.6;color:#52525b;margin:24px 0 0">Questions? Reply to this email or write to ${esc(SITE.contactEmail)} and quote ${esc(a.code)}.</p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a">${by ? `${esc(by)}, ` : ""}Timule · Indian components for drones, robots and data centers · <a href="${SITE.url}" style="color:#71717a">timule.com</a></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html, to: a.emails };
}

/** A Gmail compose window from the Timule inbox, filled in and addressed. */
export function gmailDraft(a: Pick<SupplierAccount, "company" | "code" | "emails" | "meeting">, by?: string) {
  const inv = invitation(a, by);
  const q = new URLSearchParams({ authuser: SITE.contactEmail, view: "cm", fs: "1", to: inv.to.join(","), su: inv.subject, body: inv.text });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

export const autoEmailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.INVITE_EMAIL_FROM;

/** Sends the invitation through Resend. Returns false when automatic email is not set up. */
export async function sendInvitation(a: Pick<SupplierAccount, "company" | "code" | "emails" | "meeting">, by?: string): Promise<boolean> {
  if (!autoEmailConfigured()) return false;
  const inv = invitation(a, by);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.INVITE_EMAIL_FROM, to: inv.to, reply_to: SITE.contactEmail, subject: inv.subject, html: inv.html, text: inv.text }),
  });
  if (!res.ok) throw new Error(`Email service responded ${res.status}`);
  return true;
}
