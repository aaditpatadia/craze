import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/config";
import { FOUNDERS } from "@/lib/team";

export const metadata: Metadata = {
  title: "About Timule: the founders and why we exist",
  description:
    "Timule supplies Indian-made critical components for drones, robots and data centers, each with one code, one invoice and proof of where it was made. Meet the co-founders, Aadit Patadia and Kashish Shah, and read why India's machines need parts that can be traced.",
  alternates: { canonical: "/about" },
  keywords: ["Timule", "Timule founders", "Aadit Patadia", "Kashish Shah", "Indian components supplier", "drone components India", "robot actuators India", "data center components India", "critical components supply chain India"],
};

const BELIEFS = [
  {
    n: "01",
    title: "A part is only as good as the proof behind it",
    body: "Every figure we publish says how it was checked: documents, our own measurement or an outside lab. If we have not checked something, we say so in the same place.",
  },
  {
    n: "02",
    title: "One code, whoever makes it",
    body: "A buyer orders TM-MOT-6215-170-A, not a maker's catalogue number. The same code sits on the quotation, the purchase order, the label and the invoice, and a second maker can build it if the first one fails.",
  },
  {
    n: "03",
    title: "Buyers should not have to become sourcing experts",
    body: "A drone, robotics or data center team should spend its time on the machine. We do the finding, qualifying, checking and paperwork, and we answer for the part on one invoice.",
  },
  {
    n: "04",
    title: "Indian, and able to show it",
    body: "Saying a part is Indian is easy. Showing where the magnets, wire and chips came from is the work. That is the work we do.",
  },
];

const LIMITS = [
  "We do not certify parts or suppliers. Nothing here replaces your own qualification testing.",
  "Most sample checks are on a single unit, so they say nothing about spread across a batch.",
  "We cannot confirm that a chip is genuine beyond its visible markings.",
  "Raw material origin, such as magnet alloy or carbon fibre, is sometimes unknown to us. When it is, we say so.",
  "Lead times and minimum orders are as the maker states them until a real order proves them.",
];

const personLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE.url}/about`,
  name: "About Timule",
  mainEntity: {
    "@type": "Organization",
    name: "Timule",
    url: SITE.url,
    founder: FOUNDERS.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role, sameAs: [f.linkedin] })),
  },
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }} />

      <Container as="header" className="pb-16 pt-14 sm:pt-24">
        <p className="code-text text-xs text-accent">ABOUT TIMULE</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Every critical part in an Indian machine should be able to answer one question:{" "}
          <span className="text-accent">where did you come from?</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-fg-muted">
          Timule supplies the critical components inside drones, robots and data centers: motors, controllers, actuators, fans, power supplies and cooling. Every part gets
          one code, one invoice and the proof of where it was made. We find the Indian makers, check what they build, and stand behind it when you order.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2 text-sm" aria-label="Sectors we supply">
          {["Drones and aerial systems", "Robotics", "Data centers", "Energy storage (coming)"].map((s) => (
            <li key={s}>
              <Link href="/sectors" className="inline-flex min-h-9 items-center rounded-full border border-line px-4 hover:border-line-strong">
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-y border-line bg-bg-subtle">
        <Container className="grid grid-cols-1 gap-10 py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight">Why we started</h2>
          </div>
          <div className="space-y-5 text-base text-fg-muted lg:col-span-7">
            <p>
              India is building its own machines faster than ever: drones for farms and the armed forces, robots for factories and warehouses, data centers for the
              country&apos;s cloud and AI. But open any of them up and most of the critical parts still come from abroad. In drones alone, the Drone Federation of India puts
              the share of imported brushless motors at 70 to 80 percent.
            </p>
            <p>
              Drones are where the pressure arrived first. In November 2026 the Army said its future drones must carry no foreign components, and farm drones are now scored
              on how much of them is Indian. Robots and data centers run on the same building blocks: motors and magnets, power electronics, fans and cooling. The same
              questions about origin follow them.
            </p>
            <p>
              Indian makers exist, and some are very good. What is missing is the layer between them and the buyer: someone who knows which maker to trust for which part,
              checks the batch, keeps the paperwork, and answers for the part when it arrives. That layer is Timule, across every sector that needs it.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <h2 className="text-2xl font-semibold tracking-tight">The founders</h2>
        <p className="mt-3 max-w-2xl text-fg-muted">Two people, one rule: never claim more than we can show.</p>
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {FOUNDERS.map((f) => (
            <li key={f.name} className="flex flex-col rounded-2xl border border-line p-7">
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="code-text flex size-16 items-center justify-center rounded-full border border-line-strong bg-bg-subtle text-lg font-semibold">
                  {f.initials}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{f.name}</h3>
                  <p className="text-sm text-fg-subtle">
                    {f.role} · {f.focus}
                  </p>
                </div>
              </div>
              <p className="mt-5 flex-1 text-fg-muted">{f.line}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href={`mailto:${f.email}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-line-strong">
                  <Icon name="document" size={14} /> {f.email}
                </a>
                <a
                  href={f.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-line-strong"
                >
                  <Icon name="external" size={14} /> LinkedIn
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-t border-line">
        <Container className="py-20">
          <h2 className="text-2xl font-semibold tracking-tight">What we believe</h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            {BELIEFS.map((b) => (
              <li key={b.n}>
                <p className="code-text text-xs text-accent">{b.n}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2 text-fg-muted">{b.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-line bg-bg-subtle">
        <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight">Why Timule, and not a directory</h2>
            <p className="mt-3 text-fg-muted">Lists of makers already exist. A list does not take responsibility.</p>
          </div>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
            {[
              ["One seller", "You buy from Timule, on one invoice, whoever builds the part."],
              ["Proof on every batch", "Origin declarations to the material, our own measurements, and outside lab tests where it matters."],
              ["A backup maker", "The code stays the same if a maker fails. Your design and paperwork do not change."],
              ["One supplier, many sectors", "Drone propulsion, robot joints and drive wheels, server fans, power supplies and liquid cooling, all on the same code system."],
              ["Tools engineers use", "Content calculator, propulsion sizing, CAD and flight-controller files, and firmware records, free on this site."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-bg p-5">
                <dt className="font-semibold">{k}</dt>
                <dd className="mt-1 text-sm text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight">What we cannot check yet</h2>
            <p className="mt-3 text-fg-muted">
              We would rather tell you our limits than have you find them. The full rules are on the{" "}
              <Link href="/methodology" className="text-accent hover:underline">
                methodology page
              </Link>
              .
            </p>
          </div>
          <ul className="space-y-3 text-fg-muted lg:col-span-7">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-3">
                <Icon name="minus" size={16} className="mt-1 shrink-0 text-fg-subtle" /> {l}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-16 flex flex-wrap gap-3 border-t border-line pt-10">
          <LinkButton href="/request">Tell us what you need</LinkButton>
          <LinkButton href="/investors" variant="secondary">
            For investors
          </LinkButton>
          <LinkButton href="/tools" variant="secondary">
            Try the tools
          </LinkButton>
        </div>
      </Container>
    </>
  );
}
