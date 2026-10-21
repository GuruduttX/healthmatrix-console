import type { LucideIcon } from "lucide-react";
import { Ambulance, Siren } from "lucide-react";

import { IconTile } from "@/components/ui";
import { helplines } from "@/lib/emergency";

/** One helpline, half of the pane: a crimson dish, the number big, and what it is under it. */
function Helpline({ icon, number, label, className }: { icon: LucideIcon; number: string; label: string; className: string }) {
  return (
    <a
      href={`tel:${number}`}
      aria-label={`Call ${label.toLowerCase()} ${number}`}
      className={`flex min-h-18 min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-white/50 ${className}`}
    >
      <IconTile icon={icon} size="lg" tone="danger" />
      <span className="min-w-0">
        <span className="block text-[1.375rem] font-semibold leading-7 tabular-nums tracking-[-0.01em] text-ink">{number}</span>
        <span className="block truncate text-[13px] font-medium text-body">{label}</span>
      </span>
    </a>
  );
}

/**
 * On every emergency page, including the one for a dead code: whoever scanned
 * may be standing next to someone who needs help now. Plain `tel:` links, so
 * they work without any JavaScript. Both on one pane of glass, a hairline
 * between them, as on the app's responder preview.
 */
export function HelplineBar() {
  const { ambulance, emergency } = helplines;
  return (
    <nav aria-label="Emergency helplines" className="glass-panel flex rounded-2xl">
      <Helpline icon={Ambulance} number={ambulance.number} label={ambulance.label} className="rounded-l-2xl" />
      <span aria-hidden className="my-3.5 w-px shrink-0 bg-line" />
      <Helpline icon={Siren} number={emergency.number} label={emergency.label} className="rounded-r-2xl" />
    </nav>
  );
}
