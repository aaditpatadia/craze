import type { Metadata } from "next";
import Link from "next/link";
import { FirmwareTool } from "@/components/tools/FirmwareTool";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Firmware origin records",
  description: "Tie each drone ESC or flight-controller firmware file to its part, batch, chip and source by fingerprint, and check any unit against a Timule-sealed record.",
  alternates: { canonical: "/tools/firmware" },
};

export default function FirmwarePage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/tools" className="hover:text-fg">
            Tools
          </Link>
        }
        title="Prove what code runs on every part"
        lead="'No foreign components' now reaches the code on the chips. A firmware record fingerprints the exact file on a batch, with its chip, source and licence. Timule seals it after checking, and anyone can check a unit against it."
      />
      <Container className="pb-24">
        <FirmwareTool />
      </Container>
    </>
  );
}
