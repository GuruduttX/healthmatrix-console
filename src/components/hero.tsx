import type { ReactNode } from "react";

import { HeroButtons } from "@/components/hero-buttons";

/**
 * The bleed that takes a header to the screen's edges on phones and tablets, cancelling the
 * page padding in the console layout (`px-4 sm:px-6`). Wide screens keep it inside the page.
 */
export const bleed = "-mx-4 sm:-mx-6 lg:mx-0";

/**
 * The top of a tab's own screen, as the app's tab header: a large title straight on the page with a
 * quiet line under it, and `children` under that (a search, filter pills), all scrolling over the
 * fixed light. Phones carry the bell at the right of the title; wide screens show `actions` there.
 */
export function Hero({
  title,
  description,
  eyebrow,
  actions,
  refresh = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Also a "check for updates" button on phones, for screens that change by the minute. */
  refresh?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="pt-[calc(env(safe-area-inset-top)+0.875rem)] lg:pt-5 print:hidden">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-1 lg:pt-0">
          {eyebrow ? <p className="mb-0.5 text-sm font-medium text-body">{eyebrow}</p> : null}
          <h1 className="font-display text-[1.75rem] font-semibold leading-8.5 tracking-[-0.02em] text-ink lg:text-[2.25rem] lg:leading-11">
            {title}
          </h1>
          {description ? <p className="mt-0.5 max-w-2xl text-sm font-medium leading-relaxed text-body">{description}</p> : null}
        </div>
        {actions ? <div className="hidden shrink-0 items-center gap-2 lg:flex">{actions}</div> : null}
        <HeroButtons refresh={refresh} />
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2 lg:hidden [&>*]:flex-1">{actions}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
