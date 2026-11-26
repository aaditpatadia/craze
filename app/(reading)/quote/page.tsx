import type { Metadata } from "next";
import { QuoteList } from "@/components/quote/QuoteList";
import { Icon } from "@/components/ui/Icon";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Quote list",
  description: "Parts you have collected for a quote. Send them as one sourcing request.",
  alternates: { canonical: "/quote" },
  robots: { index: false },
};

const steps = [
  "You send the list. We reply with a TMQ reference.",
  "We send each TM code and its build sheet to the makers we work with.",
  "For each part we can source, you get a price and lead time, with the evidence tier we hold and what is not yet checked.",
];

export default function QuotePage() {
  return (
    <>
      <PageHeader title="Quote list" lead="Collect parts while you browse, set quantities, then send them as one request." />
      <Container className="grid grid-cols-1 gap-14 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <QuoteList />
        </div>
        <aside className="lg:col-span-4">
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
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            The list is stored in this browser only. A request is not an order and commits you to nothing.
          </p>
        </aside>
      </Container>
    </>
  );
}
