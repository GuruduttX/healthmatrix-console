"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-ink hover:bg-selected"
    >
      <Printer aria-hidden className="size-4" />
      Print or save as PDF
    </button>
  );
}
