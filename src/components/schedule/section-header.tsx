"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** A section heading with a chevron on the right, in a round of glass, that shows or hides the section's body. */
export function SectionHeader({
  title,
  open,
  onToggle,
  controls,
}: {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Id of the element the chevron shows and hides. */
  controls: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {title}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={controls}
        aria-label={open ? "Hide details" : "Show details"}
        onClick={onToggle}
        className="btn btn-frost btn-sm btn-icon -my-1"
      >
        <ChevronDown aria-hidden className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
