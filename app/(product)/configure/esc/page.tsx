import type { Metadata } from "next";
import Link from "next/link";
import { EscConfigurator } from "@/components/configure/EscConfigurator";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Configure an ESC",
  description:
    "Specify a drone speed controller: current, battery, control, throttle signal, firmware, telemetry, BEC, mounting, cooling, wiring and origin, with a fit check against your motor.",
  alternates: { canonical: "/configure/esc" },
};

export default function ConfigureEscPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/categories/escs" className="hover:text-fg">
                  ESCs
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Configure</li>
            </ol>
          </nav>
        }
        title="Configure an ESC that fits your motor"
        lead="Choose the current, signal, firmware, power, mounting and origin. Each choice is drawn beside it, and a fit check reads your motor's current against the rating."
      >
        <p className="text-sm text-fg-subtle">
          Also configure a{" "}
          <Link href="/configure/motor" className="text-accent hover:underline">
            motor
          </Link>{" "}
          or a{" "}
          <Link href="/configure/propeller" className="text-accent hover:underline">
            propeller
          </Link>
          .
        </p>
      </PageHeader>
      <Container className="pb-24">
        <EscConfigurator />
      </Container>
    </>
  );
}
