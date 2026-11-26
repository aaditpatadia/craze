import type { Metadata } from "next";
import { MotorSpecSheet } from "@/components/configure/MotorSpecSheet";

export const metadata: Metadata = { title: "Motor specification", robots: { index: false } };

export default function MotorSheetPage() {
  return <MotorSpecSheet />;
}
