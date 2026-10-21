"use client";

import { Printer } from "lucide-react";

/** Prints the page, or saves it as a PDF. `compact`: a round of glass for the phone bar, beside the back button. */
export function PrintButton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="Print or save as PDF"
        className="btn btn-icon btn-frost size-11 min-h-11"
      >
        <Printer aria-hidden className="size-4.5" />
      </button>
    );
  }
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm">
      <Printer aria-hidden className="size-4 text-muted" />
      Print or save as PDF
    </button>
  );
}
