import type { ReactNode } from "react";

import { revealDelay } from "./reveal";

/** A small glass label with a beating dot, above a section's title. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand-deep">
      <span aria-hidden className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/60" />
        <span className="relative size-1.5 rounded-full bg-brand" />
      </span>
      {children}
    </span>
  );
}

/** Eyebrow, title and a line of lead-in, rising in one after another. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-xl max-lg:mx-auto max-lg:text-center"}>
      <div data-reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2
        data-reveal="blur"
        style={revealDelay(90)}
        className="mt-5 text-balance font-display text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]"
      >
        {title}
      </h2>
      {lede ? (
        <p data-reveal style={revealDelay(180)} className={`mt-5 text-pretty text-base leading-relaxed text-body sm:text-lg ${centered ? "mx-auto max-w-2xl" : ""}`}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}
