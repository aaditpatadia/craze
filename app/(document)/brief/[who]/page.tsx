import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlueprintDocument, BlueprintSheet, BpSection } from "@/components/blueprint/Sheet";
import { BpToolbar } from "@/components/blueprint/Toolbar";
import { SITE } from "@/lib/config";
import { getCategories, getProducts } from "@/lib/content";
import { SECTOR_LABEL } from "@/lib/format";

type Who = "buyers" | "suppliers";

const COPY: Record<
  Who,
  {
    title: string;
    kind: string;
    number: string;
    lead: string;
    why: { title: string; points: string[] };
    how: string[];
    ask: { title: string; points: string[] };
    cta: string;
    back: { href: string; label: string };
  }
> = {
  buyers: {
    title: "Critical parts you can prove, from one accountable seller",
    kind: "Brief for buyers",
    number: "TM-BRF-B",
    lead: "Timule supplies drone, robotics and data center components under its own part codes. Each code has a build sheet, a qualified maker and a written record of what was checked. You order the code from us, on one invoice, and we answer for the part.",
    why: {
      title: "What you get",
      points: [
        "Origin you can show. Every part carries a declared origin for its key materials and an evidence tier: documents received, sample inspected, or tested by an outside lab.",
        "One vendor, one invoice. Motors, ESCs, flight controllers, GNSS, propellers and frames on a single purchase order instead of many vendor approvals.",
        "Small quantities. Order 8 or 40 units for a prototype or tender sample; we combine demand across buyers.",
        "Continuity. If a maker stops, raises prices or fails a check, we move the same TM code to another qualified maker. Your drawings and paperwork do not change.",
        "A stable number. Put the TM code in your BOM and tender documents. It is the same on our quotation, your PO, the label and the invoice.",
      ],
    },
    how: [
      "Browse parts or paste your BOM into the BOM checker.",
      "Send one request. You get a TMQ reference.",
      "We reply with a quotation per TM code, lead time and the evidence we hold.",
      "You send a purchase order quoting the TM codes.",
      "We build, inspect against the build sheet, ship and invoice under the same codes.",
    ],
    ask: {
      title: "Tell us",
      points: ["The parts you import today and would rather not.", "Quantities for the next prototype, sample or production run.", "Any origin or test paperwork your customer asks you for."],
    },
    cta: "Send a request",
    back: { href: "/", label: "Timule" },
  },
  suppliers: {
    title: "Build to a Timule code. We bring the orders.",
    kind: "Brief for suppliers",
    number: "TM-BRF-S",
    lead: "Timule buys drone, robotics and data center components from Indian makers and sells them to buyers who need parts they can trace. Every part has a TM code and a build sheet. If you can build to the sheet and back it with documents, we send you orders under that code.",
    why: {
      title: "What you get",
      points: [
        "Orders without the selling. We find and serve the buyers, handle their paperwork and collect payment. You build and ship to us.",
        "A clear target. The build sheet states values, acceptance bands, the documents we need and the marking. No guessing what the buyer meant.",
        "Combined demand. Small orders from many buyers arrive as fewer, larger purchase orders under one code.",
        "Evidence that works for you. Inspections and lab results are recorded against the code under your supplier code. Good records bring repeat orders.",
        "Your name stays with us. Buyers see your TMS supplier code, not your company name.",
      ],
    },
    how: [
      "Pick the TM codes you can build and open their build sheets.",
      "Apply on the site. You get a TMA reference.",
      "Send the documents the sheet lists, and a sample where asked.",
      "We qualify you and give you a TMS supplier code.",
      "We send purchase orders (TMP) quoting the code. You label every unit with it.",
    ],
    ask: {
      title: "Our terms in short",
      points: [
        "Build to the sheet revision named on each order. Declare the origin of key parts honestly; unknown is an acceptable answer, a wrong one is not.",
        "Rejected units against the acceptance bands are replaced at your cost.",
        "Buyers we introduce are served through Timule for 24 months from the first order.",
      ],
    },
    cta: "Apply as a supplier",
    back: { href: "/suppliers/join", label: "For suppliers" },
  },
};

export function generateStaticParams() {
  return (Object.keys(COPY) as Who[]).map((who) => ({ who }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ who: string }> }): Promise<Metadata> {
  const { who } = await params;
  const c = COPY[who as Who];
  return c ? { title: `${c.kind}: ${c.title}`, alternates: { canonical: `/brief/${who}` } } : {};
}

export default async function BriefPage({ params }: { params: Promise<{ who: string }> }) {
  const { who } = await params;
  const c = COPY[who as Who];
  if (!c) notFound();
  const live = getCategories().filter((x) => x.status === "live");
  const products = getProducts();
  const sectors = [...new Set(live.map((x) => x.sector))];
  const host = SITE.url.replace(/^https?:\/\//, "");
  const ctaPath = who === "buyers" ? "/request" : "/suppliers/join";

  return (
    <BlueprintDocument toolbar={<BpToolbar back={c.back} fileName={`Timule ${c.kind.toLowerCase()}`} />}>
      <BlueprintSheet
        kind={c.kind}
        title={c.title}
        number={c.number}
        fields={[
          { label: "Document", value: c.kind },
          { label: "Live categories", value: String(live.length) },
          { label: "Part codes", value: String(products.length) },
          { label: "Sectors", value: sectors.map((s) => SECTOR_LABEL[s]).join(", ") },
          { label: "Contact", value: SITE.contactEmail },
          { label: "Revision", value: "A", mono: true },
          { label: "Web", value: host },
          { label: "Next step", value: c.cta },
          { label: "Issued by", value: "Timule" },
        ]}
      >
        <p className="bp-dim mt-3 max-w-[165mm] text-[10.5pt] leading-relaxed">{c.lead}</p>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-[1.35fr_1fr]">
          <BpSection n="01" title={c.why.title}>
            <ul className="bp-list bp-dim mt-1">
              {c.why.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </BpSection>
          <BpSection n="02" title="How it works">
            <ol className="mt-2 space-y-1.5">
              {c.how.map((h, i) => (
                <li key={h} className="flex gap-2">
                  <span className="bp-mono bp-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="bp-dim">{h}</span>
                </li>
              ))}
            </ol>
          </BpSection>
        </div>

        <BpSection n="03" title="Parts we list today">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Sector</th>
                <th className="num">Part codes</th>
              </tr>
            </thead>
            <tbody>
              {live.map((cat) => (
                <tr key={cat.id}>
                  <td className="bp-mono font-semibold">TM-{cat.code}</td>
                  <td>{cat.name}</td>
                  <td className="bp-dim">{SECTOR_LABEL[cat.sector]}</td>
                  <td className="num">{products.filter((p) => p.category === cat.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BpSection>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-[1.35fr_1fr]">
          <BpSection n="04" title={c.ask.title}>
            <ul className="bp-list bp-dim mt-1">
              {c.ask.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </BpSection>
          <BpSection n="05" title="Contact">
            <p className="mt-2 font-semibold">{SITE.contactEmail}</p>
            <p className="bp-dim mt-1">
              {c.cta}: {host}
              {ctaPath}
            </p>
            <p className="bp-dim mt-1">Code register: {host}/codes/register</p>
          </BpSection>
        </div>
      </BlueprintSheet>
    </BlueprintDocument>
  );
}
