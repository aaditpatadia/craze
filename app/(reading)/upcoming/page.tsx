import type { Metadata } from "next";
import { NotifyForm } from "@/components/forms/NotifyForm";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getUpcomingCategories } from "@/lib/content";

export const metadata: Metadata = {
  title: "Upcoming categories",
  description: "Categories we are preparing: batteries, chips and sensors, gimbals, robot actuators and data center power and cooling.",
  alternates: { canonical: "/upcoming" },
};

export default function UpcomingPage() {
  const cats = getUpcomingCategories();
  return (
    <>
      <PageHeader
        title="Upcoming categories"
        lead="We list these now so you can plan. They are not open for requests yet, and we will not list a part until we hold evidence for it."
      />
      <Container className="pb-24">
        <ul className="divide-y divide-line border-y border-line">
          {cats.map((c) => (
            <li key={c.id} id={c.id} className="grid scroll-mt-24 grid-cols-1 gap-6 py-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{c.family}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{c.name}</h2>
                <p className="mt-2 text-fg-muted">{c.summary}</p>
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <p className="text-sm font-medium">Why it matters</p>
                <p className="mt-1 text-fg-muted">{c.whyItMatters}</p>
                <div className="mt-5">
                  <NotifyForm category={c.id} categoryName={c.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
