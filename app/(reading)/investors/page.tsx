import type { Metadata } from "next";
import Link from "next/link";
import { InvestorForm } from "@/components/forms/InvestorForm";
import { Container } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { FOUNDERS } from "@/lib/team";

export const metadata: Metadata = {
  title: "For investors: the trusted supply layer for Indian drones, robots and data centers",
  description:
    "India is building its own drones, robots and data centers, and most of their critical parts are still imported. Timule supplies Indian-made components for all three under one code, on one invoice, with proof of origin. See the product live and request the deck.",
  alternates: { canonical: "/investors" },
  keywords: ["Timule investors", "deep tech supply chain India", "drone components market India", "robotics components India", "data center components India", "defence tech India", "iDEX"],
};

const WHY_NOW = [
  {
    stat: "70–80%",
    label: "of brushless motors in Indian drones are imported",
    source: "Drone Federation of India, November 2026",
  },
  {
    stat: "No foreign parts",
    label: "what the Army says its future drones must carry",
    source: "Bharat Drone Stack Conference, 12 November 2026",
  },
  {
    stat: "$3.08 bn",
    label: "projected Indian drone component market",
    source: "ET Government, citing DFI",
    href: "https://government.economictimes.indiatimes.com/news/defence/drone-industry-targets-97300-crore-by-2031-as-dfi-pushes-for-indigenous-components/135861952",
  },
];

const LIVE = [
  { href: "/tools/content", title: "Indigenous content calculator", body: "Paste a drone's parts list: see how Indian it is and what to replace." },
  { href: "/tools/sizing", title: "Propulsion sizing", body: "Weight in, matched motor, ESC and propeller out, corrected for Indian heat." },
  { href: "/sectors", title: "Three sectors, one catalogue", body: "Drone propulsion and avionics, robot joints and drive wheels, server fans, power supplies and liquid cooling." },
  { href: "/configure/motor", title: "Motor configurator", body: "28 frames, every option drawn, one TM code and build string." },
  { href: "/tools/firmware", title: "Firmware origin records", body: "Fingerprint the code on every batch, sealed by Timule." },
  { href: "/tools/files", title: "CAD and flight-controller files", body: "Drop a part into a design, and an aircraft into ArduPilot or PX4." },
  { href: "/codes/register", title: "TM code register", body: "Every part on one code system, printable as a blueprint." },
];

const MODEL = [
  ["Parts margin", "We buy from qualified Indian makers and sell under the TM code on our invoice. The buyer pays for one seller, checked batches and a backup maker."],
  ["Evidence and compliance", "Batch testing, origin dossiers and content reports for tenders and Kisan drone scoring, sold to the companies that must prove them."],
  ["Free tools, paid parts", "The tools are free and every result ends in TM codes. Engineers design our parts in from day one, and designs rarely change suppliers."],
];

const NEXT = [
  ["Now", "Product live at timule.com. First 25 Indian drone makers identified and outreach starting."],
  ["90 days", "Letters of intent from the first buyers. First maker qualified to our Tier 2 checks. GST and DPIIT registration. iDEX application."],
  ["12 months", "Repeat orders on the top motor, ESC and propeller codes. Stock of the fastest movers. First robotics and data center buyers on actuators, server fans and power supplies."],
];

export default function InvestorsPage() {
  return (
    <>
      <Container as="header" className="pb-16 pt-14 sm:pt-24">
        <p className="code-text text-xs text-accent">FOR INVESTORS</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">India is building its own drones, robots and data centers. Someone has to supply the parts, and prove where they came from.</h1>
        <p className="mt-6 max-w-2xl text-lg text-fg-muted">
          Timule is the trusted supply layer between the companies building India&apos;s machines and the Indian factories that can replace imported parts: one code for every
          critical part, one invoice, and the evidence of where it was made. Drones first, then robots and data centers on the same system.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contact" className="inline-flex min-h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg">
            Request the deck
          </a>
          <Link href="/tools/content" className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm hover:border-line-strong">
            Try the product
          </Link>
        </div>
      </Container>

      <section className="border-y border-line bg-bg-subtle" aria-labelledby="why-now">
        <Container className="py-16">
          <h2 id="why-now" className="text-2xl font-semibold tracking-tight">
            Why now
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {WHY_NOW.map((w) => (
              <li key={w.stat} className="rounded-2xl border border-line bg-bg p-6">
                <p className="text-3xl font-semibold tracking-tight text-accent lg:text-4xl">{w.stat}</p>
                <p className="mt-2 text-fg">{w.label}</p>
                <p className="mt-3 text-xs text-fg-subtle">
                  {w.href ? (
                    <a href={w.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-fg hover:underline">
                      {w.source} <Icon name="external" size={12} />
                    </a>
                  ) : (
                    w.source
                  )}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl text-fg-muted">
            The same thing happened in the United States: once drones bought for the government had to be free of Chinese parts, companies that supplied certified
            components grew quickly, and one, Unusual Machines, is now listed on the stock exchange. India is at that moment now, and no one owns this layer yet. Drones are where the rule is strictest today, so we start there. Robots and data centers are built
            from the same blocks, motors and magnets, power electronics, fans and cooling, so every maker we qualify serves more than one market.
          </p>
        </Container>
      </section>

      <Container className="py-20" aria-labelledby="live">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="live" className="text-2xl font-semibold tracking-tight">
              Built and live today
            </h2>
            <p className="mt-2 max-w-2xl text-fg-muted">Not slides. Open any of these and use it.</p>
          </div>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIVE.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group flex h-full flex-col rounded-xl border border-line p-5 transition-colors hover:border-line-strong">
                <span className="flex items-center justify-between font-semibold">
                  {l.title}
                  <Icon name="arrowRight" size={16} className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-2 text-sm text-fg-muted">{l.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-t border-line" aria-labelledby="model">
        <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="model" className="text-2xl font-semibold tracking-tight">
              How Timule makes money
            </h2>
          </div>
          <dl className="space-y-6 lg:col-span-8">
            {MODEL.map(([k, v]) => (
              <div key={k} className="border-b border-line pb-6">
                <dt className="text-lg font-semibold">{k}</dt>
                <dd className="mt-1 text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-t border-line bg-bg-subtle" aria-labelledby="moat">
        <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="moat" className="text-2xl font-semibold tracking-tight">
              What is hard to copy
            </h2>
            <p className="mt-3 text-fg-muted">Software can be copied in months. These cannot.</p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
            {[
              ["Evidence, batch by batch", "Origin declarations to the material and our own test data. It grows with every order and no directory has it."],
              ["The code system", "Once a TM code is on a buyer's drawings and purchase orders, switching costs them a requalification."],
              ["Two-sided trust", "Buyers trust one accountable seller; makers get orders without chasing dozens of small customers."],
              ["Engineers' tools", "The calculators and files put Timule parts into designs before procurement starts."],
            ].map(([k, v]) => (
              <li key={k} className="rounded-xl border border-line bg-bg p-5">
                <p className="font-semibold">{k}</p>
                <p className="mt-1 text-sm text-fg-muted">{v}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="py-20" aria-labelledby="road">
        <h2 id="road" className="text-2xl font-semibold tracking-tight">
          Where we are, and what comes next
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {NEXT.map(([k, v], i) => (
            <li key={k} className="rounded-xl border border-line p-6">
              <p className="code-text text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-lg font-semibold">{k}</p>
              <p className="mt-2 text-sm text-fg-muted">{v}</p>
            </li>
          ))}
        </ol>
      </Container>

      <section className="border-t border-line" aria-labelledby="team">
        <Container className="py-20">
          <h2 id="team" className="text-2xl font-semibold tracking-tight">
            The founders
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {FOUNDERS.map((f) => (
              <li key={f.name} className="flex items-start gap-4 rounded-xl border border-line p-5">
                <span aria-hidden="true" className="code-text flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-sm font-semibold">
                  {f.initials}
                </span>
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-sm text-fg-subtle">
                    {f.role} · {f.focus}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
                    <a href={`mailto:${f.email}`} className="text-accent hover:underline">
                      {f.email}
                    </a>
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      LinkedIn
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-fg-subtle">
            More about us and why we started on the{" "}
            <Link href="/about" className="text-accent hover:underline">
              About page
            </Link>
            .
          </p>
        </Container>
      </section>

      <section id="contact" className="scroll-mt-20 border-t border-line bg-bg-subtle" aria-labelledby="contact-title">
        <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="contact-title" className="text-2xl font-semibold tracking-tight">
              Request the deck or a call
            </h2>
            <p className="mt-3 text-fg-muted">It goes straight to both founders. We reply within a day.</p>
          </div>
          <div className="lg:col-span-8">
            <InvestorForm />
          </div>
        </Container>
      </section>
    </>
  );
}
