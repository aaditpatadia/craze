import type { Metadata } from "next";
import Link from "next/link";
import { ContentCalculator } from "@/components/tools/ContentCalculator";
import { Container, PageHeader } from "@/components/ui/Layout";
import { getCatalog } from "@/lib/content";

export const metadata: Metadata = {
  title: "Indigenous content calculator",
  description: "Paste a drone parts list and see its Indian content by cost, every foreign critical part, and the Timule part that replaces each one. Free, and your list stays in your browser.",
  alternates: { canonical: "/tools/content" },
};

export default function ContentPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/tools" className="hover:text-fg">
            Tools
          </Link>
        }
        title="How Indian is your drone?"
        lead="Paste your parts list. See your indigenous content by cost against the 50, 60 or 100 percent rule, every foreign critical part, and what the score becomes with Timule parts."
      />
      <Container className="pb-24">
        <ContentCalculator catalog={getCatalog()} />
      </Container>
    </>
  );
}
