import type { Metadata } from "next";
import { FirmwareRecordSheet } from "@/components/tools/FirmwareRecordSheet";

export const metadata: Metadata = { title: "Firmware record", robots: { index: false } };

export default function FirmwareRecordPage() {
  return <FirmwareRecordSheet />;
}
