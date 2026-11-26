import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Configure a part",
  description: "Specify a drone motor, ESC or propeller down to the last detail, see what each choice means, and get one Timule code and build string.",
  alternates: { canonical: "/configure" },
};

const PARTS = [
  {
    href: "/configure/motor",
    title: "BLDC motor",
    body: "Frame, KV and battery, shaft, both bolt patterns, bearings, magnet grade, insulation, weather sealing, leads, balance and origin.",
    code: "TM-MOT-6015-170-A",
  },
  {
    href: "/configure/esc",
    title: "ESC",
    body: "Single or 4-in-1, current, battery range, control, throttle signal, firmware, telemetry, BEC, mounting, cooling, wiring and origin, with a fit check against your motor.",
    code: "TM-ESC-45-6S-A",
  },
  {
    href: "/configure/propeller",
    title: "Propeller",
    body: "Diameter, pitch, blades, fixed or folding, material, rotation, hub, design rpm and tip speed, balance and origin.",
    code: "TM-PRP-2480-F2-A",
  },
];

export default function ConfigureIndexPage() {
  return (
    <>
      <PageHeader
        title="Configure a part"
        lead="Choose every detail that matters to your aircraft. Each choice is drawn beside it, and the result is one code and build string that the quote, the purchase order and the maker all follow."
      />
      <Container className="pb-24">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {PARTS.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="group flex h-full flex-col rounded-xl border border-line p-6 transition-colors hover:border-line-strong">
                <span className="code-text text-xs text-fg-subtle">{p.code}</span>
                <span className="mt-3 flex items-center justify-between text-lg font-semibold">
                  {p.title}
                  <Icon name="arrowRight" size={18} className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-2 text-sm text-fg-muted">{p.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
