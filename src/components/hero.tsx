import type { ReactNode } from "react";

import { HeroButtons } from "@/components/hero-buttons";

/**
 * The bleed that takes a header to the screen's edges on phones and tablets, cancelling the
 * page padding in the console layout (`px-4 sm:px-6`). Wide screens keep it inside the page.
 */
export const bleed = "-mx-4 sm:-mx-6 lg:mx-0";

/** A faint heartbeat line across the top right, as on the app's Home. */
export function PulseLine({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 240 56" fill="none" className={`pointer-events-none absolute h-14 w-60 ${className}`}>
      <path
        d="M0 30 H96 L106 30 L114 12 L124 48 L134 4 L144 40 L150 30 H240"
        stroke="#fff"
        strokeOpacity={0.09}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The top of a tab's own screen, as in the app: the title on the ink gradient, a line about
 * the screen, and `children` under it (a search, filter pills). On phones it runs under the
 * status bar to the screen's edges with rounded bottom corners, and carries the bell. Wide
 * screens show it as a rounded banner, with `actions` at the right of the title.
 *
 * `overlap`: room at the bottom for the first card to ride up over the edge.
 */
/** The dark header's frame, shared with its loading outline so the two can't drift apart. */
export const heroFrame = (overlap = false) =>
  `hero-bg relative overflow-hidden rounded-b-[2rem] px-4 pt-[calc(env(safe-area-inset-top)+0.875rem)] text-white sm:px-6 lg:rounded-3xl lg:px-8 lg:pt-7 print:hidden ${bleed} ${
    overlap ? "pb-16 lg:pb-[4.5rem]" : "pb-6 lg:pb-7"
  }`;

export function Hero({
  title,
  description,
  eyebrow,
  actions,
  overlap = false,
  refresh = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  overlap?: boolean;
  /** Also a "check for updates" button on phones, for screens that change by the minute. */
  refresh?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={heroFrame(overlap)}>
      <PulseLine className="-right-3 top-[calc(env(safe-area-inset-top)+3.25rem)] lg:right-6 lg:top-5" />
      <div className="relative flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-1 lg:pt-0">
          {eyebrow ? <p className="mb-0.5 text-[13px] font-medium text-white/70">{eyebrow}</p> : null}
          <h1 className="font-display text-[1.875rem] font-bold leading-9 tracking-[-0.01em] lg:text-[2rem] lg:leading-10">
            {title}
          </h1>
        </div>
        {actions ? <div className="hidden shrink-0 items-center gap-2 lg:flex">{actions}</div> : null}
        <HeroButtons refresh={refresh} />
      </div>
      {description ? <p className="relative mt-1 max-w-2xl text-sm leading-relaxed text-white/70">{description}</p> : null}
      {actions ? <div className="relative mt-4 flex flex-wrap gap-2 lg:hidden [&>*]:flex-1">{actions}</div> : null}
      {children ? <div className="relative mt-4">{children}</div> : null}
    </header>
  );
}

/** What rides up over a hero's bottom edge with `overlap`. */
export const overHero = "relative z-10 -mt-12 lg:-mt-14";
