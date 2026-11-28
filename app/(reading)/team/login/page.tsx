import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignIn } from "@/components/auth/SignIn";
import { TimuleMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Layout";
import { safeNext } from "@/lib/auth";
import { currentTeam } from "@/lib/auth-server";

export const metadata: Metadata = { title: "Team sign-in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const INSIDE = [
  "Pipeline: every request, letter of intent and complaint",
  "Suppliers: invite, onboard and review documents, photos and samples",
  "Verification log and batch tests for the evidence page",
  "Quotations, purchase orders and invoices",
  "The code directory: look up any Timule code",
];

export default async function TeamLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await currentTeam()) redirect(safeNext(typeof next === "string" ? next : null));
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-line lg:grid-cols-2">
        <div className="bg-inverse p-8 text-inverse-fg sm:p-10">
          <TimuleMark size={36} />
          <p className="code-text mt-8 text-xs uppercase tracking-[0.2em] opacity-70">Timule team area</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Team sign-in</h1>
          <p className="mt-3 opacity-80">For the Timule team only. One account per person, so every action is recorded against your name.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {INSIDE.map((i) => (
              <li key={i} className="flex gap-2.5 opacity-90">
                <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-bg-elev p-8 sm:p-10">
          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-fg-muted">Sessions last 7 days on this device. Sign out on shared computers.</p>
          <div className="mt-8">
            <Suspense>
              <SignIn />
            </Suspense>
          </div>
          <div className="mt-10 border-t border-line pt-6 text-sm text-fg-muted">
            <p>
              A supplier?{" "}
              <Link href="/supplier/login" className="font-medium text-accent hover:underline">
                Sign in to the supplier portal with Google
              </Link>
            </p>
            <p className="mt-2">Lost your password? Ask another team member to issue a new one.</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
