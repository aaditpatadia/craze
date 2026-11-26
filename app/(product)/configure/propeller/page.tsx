import type { Metadata } from "next";
import Link from "next/link";
import { PropConfigurator } from "@/components/configure/PropConfigurator";
import { Container, PageHeader } from "@/components/ui/Layout";

export const metadata: Metadata = {
  title: "Configure a propeller",
  description:
    "Specify a drone propeller: diameter, pitch, blades, folding or fixed, material, rotation, hub, design speed and origin, with each choice drawn beside it.",
  alternates: { canonical: "/configure/propeller" },
};

export default function ConfigurePropellerPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/categories/propellers" className="hover:text-fg">
                  Propellers
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Configure</li>
            </ol>
          </nav>
        }
        title="Configure a propeller for your motor"
        lead="Choose the size, pitch, blades, material, hub and origin. Each choice is drawn beside it, with the tip speed checked against your motor's rpm."
      >
        <p className="text-sm text-fg-subtle">
          Also configure a{" "}
          <Link href="/configure/motor" className="text-accent hover:underline">
            motor
          </Link>{" "}
          or an{" "}
          <Link href="/configure/esc" className="text-accent hover:underline">
            ESC
          </Link>
          .
        </p>
      </PageHeader>
      <Container className="pb-24">
        <PropConfigurator />
      </Container>
    </>
  );
}
