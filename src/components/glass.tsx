import type { ReactNode } from "react";

import type { DuoIcon } from "@/components/duo-icons";
import type { Tone } from "@/lib/types";

/*
 * The glass look's pieces, as the member app's (healthmatrix-app, src/components/ui/glass.tsx).
 * The page, panes and shell are styled in globals.css; these are the parts that need markup.
 */

/**
 * Two glass spheres behind a pane, peeking past its edges, as on the app's Home banner: a peach
 * one high on the right and a smaller sky-blue one low on the left. Crisp beside the pane,
 * frosted through it. Put it first in a `relative` box that also holds the pane, so the pane
 * paints over them and blurs them.
 */
export function GlassOrbs() {
  return (
    <>
      <span aria-hidden className="glass-orb-peach -right-4 top-[8%] size-15 lg:-right-7 lg:size-20" />
      <span aria-hidden className="glass-orb-sky -left-4 top-[64%] size-11 lg:-left-6 lg:size-15" />
    </>
  );
}

/** A glass glyph in a round of clear glass, as the app's quick actions. */
export function GlassDish({ children }: { children: ReactNode }) {
  return <span aria-hidden className="glass-dish size-13 [&>svg]:size-7.5 lg:size-14 lg:[&>svg]:size-8">{children}</span>;
}

const sizes = {
  sm: "size-8 [&>svg]:size-4",
  /** Leading a row in a list. */
  md: "size-10 [&>svg]:size-4.5",
};

/**
 * An icon in a round of glass (`brand-tile`), as the app's `IconTile`: the same quiet dish and
 * deep orange icon everywhere, so icons read as a set. `status` tints the dish and the icon
 * with a flag's colour, for rows whose colour means something (out of range, borderline).
 */
export function BrandIcon({ icon: Icon, size = "md", status }: { icon: DuoIcon; size?: keyof typeof sizes; status?: Tone }) {
  const tone = status === "success" || status === "warning" || status === "danger" ? status : undefined;
  return (
    <span aria-hidden data-tone={tone} className={`brand-tile ${sizes[size]}`}>
      <Icon />
    </span>
  );
}
