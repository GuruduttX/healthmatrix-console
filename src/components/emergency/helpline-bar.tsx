import { Ambulance, Phone } from "lucide-react";

import { helplines } from "@/lib/emergency";

/**
 * On every emergency page, including the one for a dead code: whoever scanned
 * may be standing next to someone who needs help now. Plain `tel:` links, so
 * they work without any JavaScript.
 */
export function HelplineBar() {
  const { ambulance, emergency } = helplines;
  return (
    <nav aria-label="Emergency helplines" className="flex flex-col gap-3">
      <a
        href={`tel:${ambulance.number}`}
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-lg font-bold text-white hover:bg-danger"
      >
        <Ambulance aria-hidden className="size-5 shrink-0" />
        Call ambulance {ambulance.number}
      </a>
      <a
        href={`tel:${emergency.number}`}
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-lg font-bold text-white hover:bg-ink-mid"
      >
        <Phone aria-hidden className="size-5 shrink-0" />
        {emergency.label} {emergency.number}
      </a>
    </nav>
  );
}
