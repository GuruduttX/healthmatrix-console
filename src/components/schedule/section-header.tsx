"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** A section heading with a chevron on the right that shows or hides the section's body. */
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
        className="rounded-full p-1 text-body hover:bg-selected hover:text-ink"
      >
        <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
