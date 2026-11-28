import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TimuleMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Layout";
import { SUPPLIER_COOKIE, supplierSession } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { isEmailHint } from "@/lib/google";

export const metadata: Metadata = { title: "Supplier portal sign-in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "not-invited": "That Google account has not been invited yet. Sign in with the email address you gave the Timule team, or ask them to add this one.",
  paused: "This supplier account is paused. Write to the Timule team.",
  unverified: "Google has not verified that email address. Use a verified Google account.",
  expired: "The sign-in took too long or was started in another tab. Please try again.",
  cancelled: "Sign-in was cancelled.",
  google: "Google sign-in did not complete. Please try again.",
  busy: "Too many attempts. Wait a minute and try again.",
  setup: "Google sign-in is being set up. Please try again later, or write to the Timule team.",
};

const INSIDE = [
  ["Your onboarding checklist", "See what is done, what is waiting for review and what is still needed."],
  ["Submit documents and proof", "Certificates, factory photos, product photos, test videos and reports, origin declarations."],
  ["Record sample shipments", "Each shipment gets a TMX code to write on the parcel."],
  ["Reviews and requests", "Every decision and note from the Timule team, and anything we ask you for."],
];

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default async function SupplierLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email?: string }> }) {
  if (await supplierSession((await cookies()).get(SUPPLIER_COOKIE)?.value)) redirect("/supplier");
  const { error, email } = await searchParams;
  const hint = isEmailHint(email) ? email : "";
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-line lg:grid-cols-2">
        <div className="bg-bg-elev p-8 sm:p-10">
          <div className="flex items-center gap-3 text-accent">
            <TimuleMark size={32} />
            <span className="code-text text-xs uppercase tracking-[0.2em] text-fg-subtle">Supplier portal</span>
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">Sign in to the Timule supplier portal</h1>
          <p className="mt-3 text-fg-muted">For makers the Timule team has invited. Use the Google account you gave us: Gmail or your company&apos;s Google Workspace.</p>
          {message ? (
            <p role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
              {message}
            </p>
          ) : null}
          {/* A plain link: the server sends the browser to Google, and Google sends it back. */}
          <a
            href={hint ? `/api/auth/google?hint=${encodeURIComponent(hint)}` : "/api/auth/google"}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line-strong/60 bg-bg px-6 font-medium transition-colors hover:border-fg hover:bg-bg-subtle"
          >
            <GoogleG /> Continue with Google
          </a>
          {hint ? <p className="mt-3 text-center text-sm text-fg-muted">Invited as <span className="font-medium text-fg">{hint}</span></p> : null}
          <p className="mt-4 text-xs text-fg-subtle">
            We receive only your name and email address from Google, to check that you were invited. By signing in you agree to the{" "}
            <Link href="/legal/supplier-terms" className="underline hover:text-fg">
              supplier terms
            </Link>{" "}
            and the{" "}
            <Link href="/legal/privacy" className="underline hover:text-fg">
              privacy notice
            </Link>
            .
          </p>
          <div className="mt-10 border-t border-line pt-6 text-sm text-fg-muted">
            <p>
              Not invited yet?{" "}
              <Link href="/suppliers/join" className="font-medium text-accent hover:underline">
                Apply to supply Timule
              </Link>
            </p>
            <p className="mt-2">
              Trouble signing in? Write to{" "}
              <a href={`mailto:${SITE.contactEmail}?subject=Supplier%20portal%20sign-in`} className="text-accent hover:underline">
                {SITE.contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
        <div className="bg-inverse p-8 text-inverse-fg sm:p-10">
          <p className="code-text text-xs uppercase tracking-[0.2em] opacity-70">Inside the portal</p>
          <ul className="mt-6 space-y-6">
            {INSIDE.map(([t, b]) => (
              <li key={t} className="flex gap-3">
                <Icon name="check" size={18} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block font-medium">{t}</span>
                  <span className="block text-sm opacity-75">{b}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm opacity-75">
            Your company name is never shown to buyers. They see your TMS supplier code and the evidence recorded against it. Your documents are visible only to you and the Timule team.
          </p>
        </div>
      </div>
    </Container>
  );
}
