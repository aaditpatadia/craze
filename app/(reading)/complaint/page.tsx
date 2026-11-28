import type { Metadata } from "next";
import Link from "next/link";
import { ComplaintForm } from "@/components/forms/ComplaintForm";
import { Container, PageHeader } from "@/components/ui/Layout";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Report a problem with a part",
  description: "Report a faulty, out-of-spec, damaged, wrong or missing Timule part. You get a TMC complaint number and a private page to follow it to resolution.",
  alternates: { canonical: "/complaint" },
};

const STEPS = [
  ["Within 1 working day", "We reply with a first answer. Within 4 working hours for a safety risk or a stopped line."],
  ["Investigation", "We pull the batch test record, check the returned units and work through it with the maker."],
  ["Corrective action", "Replace, rework or credit the affected units, and fix the cause so the next batch is right."],
  ["On file", "The finding is filed under the TM code and batch, and future batches are tested for it."],
];

export default async function ComplaintPage({ searchParams }: { searchParams: Promise<{ code?: string; order?: string }> }) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code.slice(0, 60).toUpperCase() : "";
  const order = typeof sp.order === "string" ? sp.order.slice(0, 40).toUpperCase() : "";
  return (
    <>
      <PageHeader
        eyebrow={<span className="code-text">TMC · customer complaint</span>}
        title="Report a problem with a part"
        lead="Faulty, out of spec, damaged in transit, the wrong part or short quantity. Tell us once. You get a TMC number and a private page that shows every step until it is resolved."
      />
      <Container className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ComplaintForm initialCode={code} initialOrder={order} />
        </div>
        <aside className="space-y-8 lg:col-span-5">
          <div className="rounded-xl border border-line p-6">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{i + 1}</span>
                  <span>
                    <span className="block text-sm font-medium">{t}</span>
                    <span className="block text-sm text-fg-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-sm text-fg-muted">
            Urgent? Email{" "}
            <a href={`mailto:${SITE.contactEmail}?subject=Urgent%20complaint`} className="text-accent hover:underline">
              {SITE.contactEmail}
            </a>{" "}
            as well. How replacements and refunds work is set out in our{" "}
            <Link href="/legal/returns" className="text-accent hover:underline">
              complaints and returns policy
            </Link>
            .
          </p>
        </aside>
      </Container>
    </>
  );
}
