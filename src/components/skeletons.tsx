import type { ReactNode } from "react";

/**
 * Loading outlines for console screens. Each route's `loading.tsx` builds the shape of the
 * screen it stands in for from these, using the same spacing and breakpoints as the real
 * page, so nothing jumps when the content arrives.
 */

const tones = { grey: "bg-selected", dark: "bg-ink/15", brand: "bg-brand/25" };

/** One placeholder. Sizes come from the caller; `tone` hints at a dark pill or a brand button. */
export function Bone({ className = "", tone = "grey" }: { className?: string; tone?: keyof typeof tones }) {
  return <div aria-hidden className={`rounded-full ${tones[tone]} ${className}`} />;
}

/** The outer wrapper: pulses (unless motion is reduced) and tells screen readers it is loading. */
export function SkeletonPage({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="motion-safe:animate-pulse">
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A card frame like `Card`, without contents. */
export function SkeletonCard({
  children,
  className = "",
  flush = false,
  highlight = false,
}: {
  children?: ReactNode;
  className?: string;
  flush?: boolean;
  /** Peach, like the Ekaay cards. */
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border shadow-card ${highlight ? "border-brand-light bg-brand-soft" : "border-line bg-card"} ${flush ? "overflow-hidden" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}

/** A card title: the small icon and a short bar. */
export function TitleBone({ width = "w-32" }: { width?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Bone className="size-4 rounded-md" />
      <Bone className={`h-4 ${width}`} />
    </div>
  );
}

/** Page title and the line or two under it, with an optional back link and eyebrow. */
export function HeadingBone({ back = false, eyebrow = false, lines = 2 }: { back?: boolean; eyebrow?: boolean; lines?: number }) {
  return (
    <>
      {back ? <Bone className="mb-3 h-4 w-24" /> : null}
      {eyebrow ? <Bone className="mb-2 h-3.5 w-14" /> : null}
      <Bone className="h-7 w-3/5 max-w-xs sm:h-8" />
      {lines > 0 ? (
        <div className="mt-3 flex max-w-2xl flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Bone key={i} className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      ) : null}
    </>
  );
}

/** The row of filter pills; scrolls sideways on phones like the real one. */
export function FilterBones({ widths }: { widths: string[] }) {
  return (
    <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-hidden px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {widths.map((width, i) => (
        <Bone key={i} tone={i === 0 ? "dark" : "grey"} className={`h-9 shrink-0 ${width}`} />
      ))}
    </div>
  );
}

/** A round avatar placeholder, sized like `Avatar`. */
export function AvatarBone({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8", md: "size-10", lg: "size-14" };
  return <Bone className={`${sizes[size]} shrink-0`} />;
}

/**
 * The phone list a list screen shows below `md`: one card with tappable rows. `row` draws a
 * single row's contents.
 */
export function PhoneListBone({ rows = 6, row }: { rows?: number; row: (i: number) => ReactNode }) {
  return (
    <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card md:hidden">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="px-4 py-3.5">
          {row(i)}
        </li>
      ))}
    </ul>
  );
}

/** The table a list screen shows from `md` up: a header row, then avatar-led rows. */
export function TableBone({ columns, rows = 7 }: { columns: string[]; rows?: number }) {
  return (
    <div className="mt-5 hidden overflow-hidden rounded-2xl border border-line bg-card shadow-card md:block">
      <div className="flex items-center gap-4 border-b border-line px-5 py-3.5">
        {columns.map((width, i) => (
          <Bone key={i} className={`h-3 ${width}`} />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            {columns.map((width, i) =>
              i === 0 ? (
                <div key={i} className={`flex items-center gap-3 ${width}`}>
                  <AvatarBone size="sm" />
                  <Bone className="h-3.5 flex-1" />
                </div>
              ) : (
                <Bone key={i} className={`h-3.5 ${width} ${(r + i) % 3 === 0 ? "opacity-60" : ""}`} />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A chip-shaped placeholder. */
export function ChipBone({ width = "w-16" }: { width?: string }) {
  return <Bone className={`h-6 ${width}`} />;
}

/** One row of `ConsultRow`: time and status on top on phones, then patient, then the action. */
export function ConsultRowBone() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 sm:flex sm:items-start sm:gap-x-4 sm:px-5">
      <div className="col-span-2 flex items-center justify-between gap-3 sm:w-20 sm:shrink-0 sm:pt-2.5">
        <Bone className="h-4 w-16" />
        <span className="sm:hidden">
          <ChipBone />
        </span>
      </div>
      <AvatarBone />
      <div className="min-w-0 sm:flex-1">
        <Bone className="h-4 w-36" />
        <Bone className="mt-2 h-3.5 w-48 max-w-full" />
        <div className="mt-2.5 flex gap-2">
          <ChipBone width="w-20" />
          <ChipBone width="w-14" />
        </div>
      </div>
      <Bone className="col-span-2 h-10 w-full sm:h-9 sm:w-28" />
    </div>
  );
}

/** A card with a title and a few text lines. */
export function TextCardBone({ lines = 3, title = "w-32", highlight = false }: { lines?: number; title?: string; highlight?: boolean }) {
  return (
    <SkeletonCard highlight={highlight}>
      <TitleBone width={title} />
      <div className="mt-4 flex flex-col gap-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <Bone key={i} className={`h-3.5 ${i % 3 === 2 ? "w-1/2" : i % 2 ? "w-4/5" : "w-full"}`} />
        ))}
      </div>
    </SkeletonCard>
  );
}

/** A card of label–value rows, e.g. results or profile details. */
export function RowsCardBone({ rows = 4, title = "w-28", chip = false }: { rows?: number; title?: string; chip?: boolean }) {
  return (
    <SkeletonCard>
      <TitleBone width={title} />
      <div className="mt-3 divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Bone className={`h-3.5 ${i % 2 ? "w-24" : "w-32"}`} />
            <Bone className="ml-auto h-3.5 w-12" />
            {chip ? <ChipBone width="w-14" /> : null}
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

/**
 * `PatientHeader`: back link, then avatar beside the name, details and alert chips. The
 * consult button is left out; most patients don't have one today.
 */
export function PatientHeaderBone() {
  return (
    <>
      <Bone className="h-4 w-24" />
      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 sm:flex sm:gap-x-5">
        <AvatarBone size="lg" />
        <div className="contents sm:block sm:min-w-0 sm:flex-1">
          <Bone className="h-7 w-44 sm:h-8 sm:w-56" />
          <Bone className="col-span-2 h-3.5 w-full max-w-sm sm:mt-2.5" />
          <div className="col-span-2 flex gap-2 sm:mt-2.5">
            <ChipBone width="w-28" />
            <ChipBone width="w-20" />
          </div>
        </div>
      </div>
    </>
  );
}
