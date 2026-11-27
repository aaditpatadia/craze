import type { Metadata } from "next";
import { ContentReport } from "@/components/tools/ContentReport";

export const metadata: Metadata = { title: "Indigenous content report", robots: { index: false } };

export default function ContentReportPage() {
  return <ContentReport />;
}
