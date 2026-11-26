import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageHeader, Prose } from "@/components/ui/Layout";
import { SITE } from "@/lib/config";

const DOCS = {
  terms: {
    title: "Terms of use",
    body: (
      <>
        <p>
          <strong>Placeholder.</strong> These terms have not been written yet. Replace this page with terms reviewed by a
          lawyer before launch.
        </p>
        <h2>Points the final terms should cover</h2>
        <ul>
          <li>The catalogue describes evidence we hold; it is not a warranty or a certification.</li>
          <li>Requests are enquiries, not orders, until a written quote is accepted.</li>
          <li>Supplier figures are as stated by the supplier unless an evidence record says otherwise.</li>
          <li>Use of the 3D models and diagrams.</li>
        </ul>
      </>
    ),
  },
  privacy: {
    title: "Privacy notice",
    body: (
      <>
        <p>
          <strong>Placeholder.</strong> This notice has not been finalised. Replace it with a reviewed notice before launch.
        </p>
        <h2>What this site does today</h2>
        <ul>
          <li>The request form collects your company, email, role and the parts you need, to reply to your request.</li>
          <li>The notify form collects an email address, to tell you when a category opens.</li>
          <li>The BOM checker runs in your browser. Files you check are not uploaded unless you send them as a request.</li>
          <li>The supplier form collects your company, contact details and the parts you can make, to reply to your application.</li>
          <li>Form submissions are delivered to us by email through Formspree, a form processing service.</li>
          <li>Analytics, when enabled, are cookie-free and record page views and a few anonymous events.</li>
        </ul>
        <p>
          Questions about your data: write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </>
    ),
  },
} as const;

type DocKey = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = DOCS[doc as DocKey];
  return d ? { title: d.title, alternates: { canonical: `/legal/${doc}` }, robots: { index: false } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCS[doc as DocKey];
  if (!d) notFound();
  return (
    <>
      <PageHeader title={d.title} />
      <Container className="pb-24">
        <Prose>{d.body}</Prose>
      </Container>
    </>
  );
}
