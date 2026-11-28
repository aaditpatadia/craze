import type { Metadata } from "next";
import { ReserveForm } from "@/components/forms/ReserveForm";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Reserve a part: send a letter of intent",
  description:
    "Reserve Timule TM codes for drone, robotics and data center parts with a non-binding letter of intent. We plan maker capacity against it, and you track it from received to delivered.",
  alternates: { canonical: "/reserve" },
};

const WHY = [
  ["Capacity held for you", "We plan Indian maker capacity against letters of intent, so your parts are built when you need them."],
  ["Price and lead time in writing", "We confirm a price band, lead time and the evidence we hold for each code within one working day."],
  ["Batch tested before it ships", "When you order, every batch is tested against the code's build sheet and only passing parts are released."],
  ["Nothing binding", "No payment and no commitment until you send a purchase order. Change or withdraw it at any time."],
];

export default async function ReservePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const initial = code && /^TM-[A-Z]{3}(-[A-Z0-9]+)+$/i.test(code) ? code.toUpperCase().replace(/-A$/, "") : "";
  return (
    <>
      <PageHeader
        title="Reserve a part"
        lead="Send a non-binding letter of intent for the TM codes you plan to buy. It takes two minutes and tells us which parts to have ready for you."
      />
      <Container className="grid grid-cols-1 gap-14 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ReserveForm initialCode={initial} />
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="text-sm font-semibold">Why send one</h2>
          <dl className="mt-4 space-y-5">
            {WHY.map(([k, b]) => (
              <div key={k}>
                <dt className="text-sm font-medium">{k}</dt>
                <dd className="mt-1 text-sm text-fg-muted">{b}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </Container>
    </>
  );
}
