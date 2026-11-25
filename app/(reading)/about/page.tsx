import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Container, PageHeader, Prose } from "@/components/ui/Layout";
import { SITE, USE_PLACEHOLDER_DATA } from "@/lib/config";

export const metadata: Metadata = {
  title: "About, what we check and our limits",
  description: "What we check on drone, robotics and data center parts and suppliers, how we check it, and what we cannot check yet.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="What we check, how, and our limits"
        lead={`${SITE.name} gives every critical drone, robotics and data center part one VK code, with the evidence behind each claim, so engineers can decide what to trust before they buy.`}
      />
      <Container className="pb-24">
        <Prose>
          {USE_PLACEHOLDER_DATA ? (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm">
              <strong>This site currently shows sample data.</strong> Every supplier, lab, figure and evidence record is
              fictional. The structure is real; the content is a placeholder.
            </p>
          ) : null}

          <h2>What we check</h2>
          <ul>
            <li>Supplier documents, matched against the part numbers we receive.</li>
            <li>Physical samples, measured on our bench, with each method recorded.</li>
            <li>Where it is made: final assembly, and the origin of key materials where we can trace them.</li>
            <li>Factory checks, on site or by recorded video, and we say which.</li>
            <li>Independent lab tests, when a part has one, with the report attached.</li>
          </ul>

          <h2>How we record it</h2>
          <p>
            Each claim carries an evidence tier, the date it was checked, who checked it, and what was not checked. The full
            rules are on the <Link href="/methodology">methodology page</Link>. Our content is validated automatically before
            each release: a claim without a date or without stated limits stops the release.
          </p>

          <h2>Our limits</h2>
          <ul>
            <li>We do not certify parts or suppliers. Nothing here replaces your own qualification testing.</li>
            <li>Most sample checks are on a single unit. They say nothing about spread across a batch.</li>
            <li>We cannot confirm that a chip is genuine beyond its visible markings.</li>
            <li>Raw material origin, such as lamination steel or carbon fibre, is often unknown to us. When it is, we say so.</li>
            <li>We have not yet run long-duration, thermal or in-flight tests on any part.</li>
            <li>Supplier terms such as lead time and minimum order are as stated by the supplier until tested on a real order.</li>
          </ul>

          <h2>3D models</h2>
          <p>
            Some parts have an interactive 3D model. Each model says where it came from. Illustrative models are our own
            simplified drawings, made to explain how a part works, and are labelled as such.
          </p>
        </Prose>
        <div className="mt-12 flex flex-wrap gap-3">
          <LinkButton href="/parts">Explore parts</LinkButton>
          <LinkButton href="/request" variant="secondary">
            Send a request
          </LinkButton>
        </div>
      </Container>
    </>
  );
}
