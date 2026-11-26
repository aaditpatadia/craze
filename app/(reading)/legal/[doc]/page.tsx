import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageHeader, Prose } from "@/components/ui/Layout";
import { SITE } from "@/lib/config";

const DRAFT = (
  <p>
    <strong>Draft for legal review.</strong> This text sets out how {SITE.name} intends to work. It has not yet been reviewed by a lawyer and may change
    before the first order. Where a signed quotation or purchase order says something different, the signed document wins.
  </p>
);

const DOCS = {
  terms: {
    title: "Terms for buyers",
    body: (
      <>
        {DRAFT}
        <h2>The site</h2>
        <ul>
          <li>The catalogue describes the parts we offer and the evidence we hold for each claim. It is not a warranty or a certification.</li>
          <li>Figures are as stated by the maker unless an evidence record on the part page says we or a lab checked them.</li>
          <li>3D models and drawings are simplified illustrations, labelled as such. They are not manufacturing drawings.</li>
          <li>Sample data is marked as sample data. It describes fictional suppliers and figures and is shown only to explain the catalogue.</li>
        </ul>
        <h2>Requests and quotations</h2>
        <ul>
          <li>A request (TMQ reference) is an enquiry. It commits neither side.</li>
          <li>A quotation states prices per TM code, GST, lead time and validity. It becomes a contract when we accept your purchase order quoting it.</li>
          <li>You buy from {SITE.name}. We choose and manage the qualified maker for each code and do not disclose makers&apos; names.</li>
        </ul>
        <h2>Orders, payment and delivery</h2>
        <ul>
          <li>Unless the quotation says otherwise: 50 percent with the order, the balance before dispatch.</li>
          <li>Lead time runs from receipt of the advance. Delivery is to the address on your purchase order.</li>
          <li>Every unit is marked with its TM code and supplied to the build sheet revision on the order date.</li>
        </ul>
        <h2>Inspection and returns</h2>
        <ul>
          <li>Report shortages or transit damage within 7 days of delivery.</li>
          <li>Units that fail the acceptance bands on the build sheet are replaced or refunded, at our choice, once returned.</li>
          <li>Our liability for an order is limited to the price paid for the affected units, except where the law does not allow a limit.</li>
        </ul>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
      </>
    ),
  },
  "supplier-terms": {
    title: "Terms for suppliers",
    body: (
      <>
        {DRAFT}
        <h2>Applying and qualifying</h2>
        <ul>
          <li>Applying (TMA reference) is free and commits you to nothing.</li>
          <li>We qualify a supplier for a TM code from documents, a sample and, where needed, a site visit. Qualified suppliers get a TMS supplier code.</li>
          <li>Buyers see your TMS code and the evidence recorded against it, never your company name. We do not publish your documents.</li>
        </ul>
        <h2>Orders</h2>
        <ul>
          <li>We order by purchase order (TMP reference) quoting the TM code and build sheet revision.</li>
          <li>Build to the sheet. Declare the origin of key parts honestly: &quot;unknown&quot; is an acceptable answer, a wrong one is not.</li>
          <li>Mark every unit and carton with the TM code, batch number and our purchase order number. Do not add your own brand unless the order asks for it.</li>
          <li>Send the documents the build sheet lists with each shipment.</li>
        </ul>
        <h2>Acceptance</h2>
        <ul>
          <li>We inspect against the acceptance bands on the build sheet. Rejected units are replaced at your cost, including return freight.</li>
          <li>Inspection and lab results are recorded against your supplier code and used when we allocate orders.</li>
        </ul>
        <h2>Payment</h2>
        <ul>
          <li>Payment terms are set on each purchase order. Invoice us quoting the purchase order number and TM codes.</li>
        </ul>
        <h2>Non-circumvention and confidentiality</h2>
        <ul>
          <li>Buyers we introduce to parts made to Timule codes are served through {SITE.name} for 24 months from your first order with us. Please do not quote them directly in that time.</li>
          <li>Build sheets, buyer details and prices we share are confidential to the order.</li>
        </ul>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
        </p>
      </>
    ),
  },
  privacy: {
    title: "Privacy notice",
    body: (
      <>
        {DRAFT}
        <h2>What we collect and why</h2>
        <ul>
          <li>The request form collects your company, email, role and the parts you need, to reply to your request.</li>
          <li>The supplier form collects your company, contact details and the parts you can make, to reply to your application.</li>
          <li>The notify form collects an email address, to tell you when a category opens.</li>
          <li>The BOM checker and quote list run in your browser. Nothing is sent until you submit a request.</li>
          <li>Form submissions reach us by email through Formspree, a form processing service.</li>
          <li>Analytics, when enabled, are cookie-free and record page views and a few anonymous events.</li>
        </ul>
        <h2>Your choices</h2>
        <p>
          To see, correct or delete what we hold about you, write to <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
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
