import type { Metadata } from "next";
import Link from "next/link";
import { SizingTool } from "@/components/tools/SizingTool";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Drone propulsion sizing",
  description:
    "Enter weight, rotors, propeller and battery. Get a matched motor, ESC and propeller with TM codes, hover time, currents and warnings, corrected for Indian heat and altitude, plus ArduPilot and PX4 starting parameters.",
  alternates: { canonical: "/tools/sizing" },
};

export default function SizingPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/tools" className="hover:text-fg">
            Tools
          </Link>
        }
        title="Size your motors, ESCs and propellers"
        lead="Enter the aircraft. Get a matched set with TM codes, hover time, currents and margins, corrected for the heat and altitude you fly in, with flight-controller parameters and CAD files to download."
      />
      <Container className="pb-24">
        <SizingTool />
      </Container>
    </>
  );
}
