import type { ReactNode } from "react";

import { bleed } from "@/components/hero";

/**
 * Loading outlines for console screens. Each route's `loading.tsx` builds the shape of the
 * screen it stands in for from these, using the same spacing and breakpoints as the real
 * page, so nothing jumps when the content arrives.
 */

const tones = { grey: "bg-selected", dark: "bg-ink/15", brand: "bg-brand/25", frost: "glass-small", glass: "bg-white/12" };

/**
 * One placeholder: a see-through grey, so it sits on glass. Sizes come from the caller; `tone`
 * hints at a dark pill, a brand button or (`frost`) a round glass button, or (`glass`) sits on the
 * dark video call. A `rounded-*` from the caller replaces the default corners (two would clash);
 * so would a fill, so a glass look is a tone, never a class passed in.
 */
export function Bone({ className = "", tone = "grey" }: { className?: string; tone?: keyof typeof tones }) {
  const corners = /(^|\s)rounded-/.test(className) ? "" : "rounded-md";
  return <div aria-hidden data-bone className={`${corners} ${tones[tone]} ${className}`} />;
}

/**
 * The outer wrapper: tells screen readers it is loading. Its placeholders pulse (unless motion is
 * reduced), not the whole page: glass can't see through an ancestor that is fading.
 */
export function SkeletonPage({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="skeleton-page">
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A card frame like `Card`, a pane of glass, without contents. */
export function SkeletonCard({
  children,
  className = "",
  flush = false,
}: {
  children?: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-2xl glass-panel ${flush ? "overflow-hidden" : "p-4 sm:p-5"} ${className}`}>
      {children}
    </div>
  );
}

/** A card title: the small round tile and a short bar. */
export function TitleBone({ width = "w-32" }: { width?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Bone className="size-8 rounded-full" />
      <Bone className={`h-4.5 ${width}`} />
    </div>
  );
}

/** A section's title above its card, as `Section` draws it. */
export function SectionBone({
  width = "w-36",
  children,
  className = "",
}: {
  width?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-3 flex min-h-7 items-center gap-2.5 px-0.5">
        <Bone className={`h-5 ${width}`} />
      </div>
      {children}
    </div>
  );
}

/**
 * A tab's header, as `PageHeader` draws it without `back`: the real title (it never changes),
 * placeholder lines for the rest, and room for filter pills when `filters` is given.
 */
export function HeroBone({
  title,
  lines = 1,
  filters,
  search = false,
  action = false,
  refresh = false,
}: {
  title: string;
  lines?: number;
  /** Widths of the filter pills under the title. */
  filters?: string[];
  /** Phones: the search box. */
  search?: boolean;
  /** A main action: under the title on phones, at its right on wide screens. */
  action?: boolean;
  /** Phones: "check for updates" beside the bell, as `PageHeader` with `refresh`. */
  refresh?: boolean;
}) {
  return (
    <div className="mb-6 pt-[calc(env(safe-area-inset-top)+0.875rem)] lg:mb-7 lg:pt-5">
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 pt-1 font-display text-[1.75rem] font-semibold leading-8.5 tracking-[-0.02em] text-ink lg:pt-0 lg:text-[2.25rem] lg:leading-11">
          {title}
        </p>
        {action ? <Bone tone="brand" className="hidden h-10 w-40 rounded-full lg:block" /> : null}
        {refresh ? <Bone tone="frost" className="size-11 shrink-0 rounded-full lg:hidden" /> : null}
        <Bone tone="frost" className="size-11 shrink-0 rounded-full lg:hidden" />
      </div>
      {lines > 0 ? (
        <div className="mt-2 flex max-w-2xl flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Bone key={i} className={`h-3.5 ${i === lines - 1 ? "w-3/5" : "w-full"}`} />
          ))}
        </div>
      ) : null}
      {action ? <Bone tone="brand" className="mt-4 h-12 w-full rounded-full lg:hidden" /> : null}
      {search ? <Bone className="mt-4 h-13 w-full rounded-2xl lg:hidden" /> : null}
      {filters ? (
        <div className="mt-4 flex gap-2 overflow-hidden">
          {filters.map((width, i) => (
            <Bone key={i} tone={i === 0 ? "dark" : "grey"} className={`h-9.5 shrink-0 rounded-full lg:h-8.5 ${width}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A screen opened from a tab, as `PageHeader` draws it with `back`: on phones the bar's round
 * back button, on wide screens the back link; then the big title and its lines.
 */
export function StackBone({ eyebrow = false, lines = 2, action = false }: { eyebrow?: boolean; lines?: number; action?: boolean }) {
  return (
    <>
      <div className={`flex items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:hidden ${bleed}`}>
        <Bone tone="frost" className="size-11 rounded-full" />
      </div>
      <div className="mb-5 mt-2 lg:mb-6 lg:mt-0">
        <Bone className="mb-3 hidden h-6 w-28 rounded-full lg:block" />
        {eyebrow ? <Bone className="mb-2 h-3.5 w-24" /> : null}
        <Bone className="h-8 w-3/5 max-w-xs lg:h-9" />
        {lines > 0 ? (
          <div className="mt-3 flex max-w-2xl flex-col gap-2">
            {Array.from({ length: lines }, (_, i) => (
              <Bone key={i} className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        ) : null}
        {action ? <Bone className="mt-4 h-12 w-full rounded-full sm:w-44 lg:h-10" /> : null}
      </div>
    </>
  );
}

/** `PatientHeader`: the glass card with the avatar, name, details and alert pills. */
export function PatientHeroBone({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className={`flex items-center px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-6 lg:hidden ${bleed}`}>
        <Bone tone="frost" className="size-11 rounded-full" />
      </div>
      <Bone className="mb-3 hidden h-6 w-28 rounded-full lg:block" />
      <div className={`glass-panel mt-2 rounded-2xl px-4 sm:px-6 lg:mt-0 lg:px-7 ${compact ? "py-4 lg:py-5" : "py-5 lg:py-6"}`}>
        <div
          className={`flex gap-x-5 gap-y-3 ${compact ? "items-start lg:items-center" : "flex-col items-center lg:flex-row"}`}
        >
          <Bone className={`shrink-0 rounded-full ${compact ? "size-16" : "size-20"}`} />
          <div className={`flex min-w-0 flex-1 flex-col gap-2.5 ${compact ? "" : "items-center lg:items-start"}`}>
            <Bone className={compact ? "h-6 w-40" : "h-7 w-48"} />
            <Bone className="h-3.5 w-64 max-w-full" />
            <div className="flex gap-1.5">
              <Bone className="h-6.5 w-32 rounded-full" />
              <Bone className="h-6.5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Filter pills on the light page. */
export function FilterBones({ widths }: { widths: string[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-hidden px-4 sm:mx-0 sm:px-0">
      {widths.map((width, i) => (
        <Bone key={i} tone={i === 0 ? "dark" : "grey"} className={`h-9.5 shrink-0 rounded-full ${width}`} />
      ))}
    </div>
  );
}

/** A round avatar placeholder, sized like `Avatar`. */
export function AvatarBone({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-9", md: "size-11", lg: "size-14" };
  return <Bone className={`${sizes[size]} shrink-0 rounded-full`} />;
}

/** A round icon tile placeholder, sized like `IconTile` at `md`. */
export function TileBone() {
  return <Bone className="size-10 shrink-0 rounded-full" />;
}

/**
 * The phone list a list screen shows below `md`: one card with tappable rows. `row` draws a
 * single row's contents.
 */
export function PhoneListBone({ rows = 6, row }: { rows?: number; row: (i: number) => ReactNode }) {
  return (
    <ul className="glass-panel divide-y divide-line overflow-hidden rounded-2xl md:hidden">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="px-4 py-4">
          {row(i)}
        </li>
      ))}
    </ul>
  );
}

/** The table a list screen shows from `md` up: a header row, then avatar-led rows. */
export function TableBone({ columns, rows = 7 }: { columns: string[]; rows?: number }) {
  return (
    <div className="glass-panel hidden overflow-hidden rounded-2xl md:block">
      <div className="flex items-center gap-4 border-b border-line px-5 py-3.5">
        {columns.map((width, i) => (
          <Bone key={i} className={`h-3 ${width}`} />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
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

/** A pill-shaped placeholder, like `Chip`. */
export function ChipBone({ width = "w-16" }: { width?: string }) {
  return <Bone className={`h-5 rounded-full ${width}`} />;
}

/** One row of `ConsultRow`: the time chip, then patient, reason and chips, then status and action. */
export function ConsultRowBone() {
  return (
    <div className="flex gap-3 px-4 py-3.5 sm:items-center sm:gap-4 sm:px-5">
      <Bone className="h-11.5 w-13 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Bone className="h-4.5 w-40 max-w-full" />
          <Bone className="h-3 w-16 sm:hidden" />
        </div>
        <Bone className="mt-2 h-3.5 w-56 max-w-full" />
        <div className="mt-2.5 flex gap-2">
          <ChipBone width="w-24" />
          <ChipBone width="w-12" />
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <Bone className="h-3 w-16" />
        <Bone className="h-8.5 w-20 rounded-full" />
      </div>
    </div>
  );
}

/** The heading row of a flush card, as `PanelHeader` draws it. */
export function PanelHeaderBone({ width = "w-32" }: { width?: string }) {
  return (
    <div className="flex h-15 items-center border-b border-line px-4 sm:px-5">
      <TitleBone width={width} />
    </div>
  );
}

/** A card with a title and a few text lines. */
export function TextCardBone({ lines = 3, title = "w-32" }: { lines?: number; title?: string }) {
  return (
    <SkeletonCard>
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

/** List rows with an icon tile or avatar, two lines and a chevron, inside a flush card. */
export function TileRowsBone({ rows = 3, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <SkeletonCard flush>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            {avatar ? <AvatarBone size="sm" /> : <TileBone />}
            <div className="min-w-0 flex-1">
              <Bone className={`h-4 ${i % 2 ? "w-32" : "w-40"} max-w-full`} />
              <Bone className="mt-2 h-3 w-48 max-w-full" />
            </div>
            <Bone className="size-4 shrink-0" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}
