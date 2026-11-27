import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/Layout";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Engineering tools",
  description: "Free tools for drone teams: indigenous content calculator, propulsion sizing, CAD and flight-controller downloads, and firmware origin records.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  {
    href: "/tools/content",
    title: "Indigenous content calculator",
    body: "Paste a parts list. Get the Indian share by cost against the 50, 60 or 100 percent rule, every foreign critical part, and the score with Timule replacements. Blueprint report for your bid.",
    who: "Bid, compliance and purchase teams",
  },
  {
    href: "/tools/sizing",
    title: "Propulsion sizing",
    body: "Weight, rotors, propeller, battery and where you fly. Get a matched motor, ESC and propeller, hover time, currents and warnings, corrected for Indian heat and altitude.",
    who: "Design engineers",
  },
  {
    href: "/tools/sizing#downloads",
    title: "CAD and flight-controller files",
    body: "STL envelopes and 1:1 DXF drilling drawings for every configured part, plus ArduPilot and PX4 starting parameters from your sizing.",
    who: "Mechanical and firmware engineers",
  },
  {
    href: "/tools/firmware",
    title: "Firmware origin records",
    body: "Fingerprint the firmware on each batch with its chip, source and licence. Timule seals the record; anyone can check a unit against it.",
    who: "Quality teams and auditors",
  },
];

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="Tools for teams building Indian drones"
        lead="Free, and they run in your browser: your parts lists and files stay with you. Each one ends in TM codes you can order on one Timule invoice."
      />
      <Container className="pb-24">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="group flex h-full flex-col rounded-xl border border-line p-6 transition-colors hover:border-line-strong">
                <span className="text-xs text-fg-subtle">{t.who}</span>
                <span className="mt-2 flex items-center justify-between text-lg font-semibold">
                  {t.title}
                  <Icon name="arrowRight" size={18} className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-2 text-sm text-fg-muted">{t.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
