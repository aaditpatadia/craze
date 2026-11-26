import type { Metadata } from "next";
import Link from "next/link";
import { MotorConfigurator } from "@/components/configure/MotorConfigurator";
import { Container, PageHeader } from "@/components/ui/Layout";
import { FRAMES } from "@/lib/motor-config";

export const metadata: Metadata = {
  title: "Configure a BLDC motor",
  description:
    "Specify a drone motor down to the shaft, bolt patterns, magnet grade, leads and origin. Every choice is drawn beside it, and the result is one Timule code and build string.",
  alternates: { canonical: "/configure/motor" },
};

export default function ConfigureMotorPage() {
  const kvCount = FRAMES.reduce((n, f) => n + f.kvs.length, 0);
  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/categories/bldc-motors" className="hover:text-fg">
                  BLDC motors
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Configure</li>
            </ol>
          </nav>
        }
        title="Configure a motor, down to the last bolt"
        lead={`${FRAMES.length} standard frames and ${kvCount} windings. Choose every detail that matters to your airframe, see what each choice means beside it, and get one code and build string the maker follows exactly.`}
      >
        <p className="text-sm text-fg-subtle">
          Also configure an{" "}
          <Link href="/configure/esc" className="text-accent hover:underline">
            ESC
          </Link>{" "}
          or a{" "}
          <Link href="/configure/propeller" className="text-accent hover:underline">
            propeller
          </Link>
          .
        </p>
      </PageHeader>
      <Container className="pb-24">
        <MotorConfigurator />
      </Container>
    </>
  );
}
