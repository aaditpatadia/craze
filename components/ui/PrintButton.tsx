"use client";

import { Button } from "./Button";
import { Icon } from "./Icon";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
      <Icon name="printer" size={16} /> {label}
    </Button>
  );
}
