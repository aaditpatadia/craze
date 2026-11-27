import type { Metadata } from "next";
import Link from "next/link";
import { EngineerFiles } from "@/components/tools/EngineerFiles";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "CAD and flight-controller files",
  description: "STL envelopes and 1:1 DXF drilling drawings for drone motors, ESCs and propellers, and ArduPilot and PX4 starting parameters for the aircraft you have built.",
  alternates: { canonical: "/tools/files" },
};

export default function FilesPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/tools" className="hover:text-fg">
            Tools
          </Link>
        }
        title="CAD and flight-controller files"
        lead="Drop a part straight into your design, and your aircraft straight into its flight software. For engineers who already know their parts: no sizing needed."
      />
      <Container className="pb-24">
        <EngineerFiles />
      </Container>
    </>
  );
}
