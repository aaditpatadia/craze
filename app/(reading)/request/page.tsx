import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestForm, RequestFormStatic } from "@/components/forms/RequestForm";
import { Container, PageHeader } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Send a sourcing request",
  description: "Tell us which parts you need. We reply with what we can source and the evidence we hold for each part.",
  alternates: { canonical: "/request" },
};

const steps = [
  "We match your parts against the catalogue and our supplier list.",
  "For each part, we tell you the evidence tier we hold and what has not been checked.",
  "Where we have no match, we say so and tell you whether we can look further.",
];

export default function RequestPage() {
  return (
    <>
      <PageHeader title="Send a sourcing request" lead="Tell us what you need. One request can cover a whole bill of materials." />
      <Container className="grid grid-cols-1 gap-14 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Suspense fallback={<RequestFormStatic />}>
            <RequestForm />
          </Suspense>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="text-sm font-semibold">What happens next</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm text-fg-muted">
                <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-8 flex gap-2 text-sm text-fg-subtle">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />A request is not an order and commits you to nothing.
          </p>
          <p className="mt-4 text-sm text-fg-subtle">
            Prefer email? Write to{" "}
            <a href={`mailto:${SITE.contactEmail}`} className="text-fg-muted underline underline-offset-4 hover:text-fg">
              {SITE.contactEmail}
            </a>
            .
          </p>
        </aside>
      </Container>
    </>
  );
}
