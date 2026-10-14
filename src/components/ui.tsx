import type { LucideIcon } from "lucide-react";
import { Ban, ChevronRight, Clock, Lock, LockOpen, TimerOff } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Hero } from "@/components/hero";
import { BackLink, StackBar } from "@/components/stack-bar";
import type { AccessStatus, AvatarTone, ResultFlag, Tone } from "@/lib/types";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand",
  neutral: "bg-selected text-ink-mid",
};

export const dotTone: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-[#c98a00]",
  danger: "bg-danger",
  brand: "bg-brand",
  neutral: "bg-muted",
};

/** A faint ring of the dot's own colour, to sit a dot on a row with some presence. */
export const dotHalo: Record<Tone, string> = {
  success: "ring-success/15",
  warning: "ring-[#c98a00]/15",
  danger: "ring-danger/15",
  brand: "ring-brand/15",
  neutral: "ring-muted/15",
};

/**
 * A small status label, a pill like the app's tags. `dot` swaps the tinted pill for a coloured
 * dot beside plain text, for statuses that sit in a row with others and shouldn't all shout.
 */
export function Chip({
  tone = "neutral",
  icon: Icon,
  dot = false,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  dot?: boolean;
  children: ReactNode;
}) {
  if (dot) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-body">
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dotTone[tone]}`} />
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold leading-4 ${toneClasses[tone]}`}
    >
      {Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
      {children}
    </span>
  );
}

const tileSizes = {
  xs: "size-7 rounded-lg [&>svg]:size-4",
  sm: "size-8 rounded-[0.625rem] [&>svg]:size-4",
  md: "size-10 rounded-xl [&>svg]:size-5",
  lg: "size-11 rounded-[0.875rem] [&>svg]:size-5",
};

const softTones: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-selected text-ink-mid",
};

const tileLooks = {
  /** An icon on its tone's soft tint, as the app's IconTile. */
  soft: "",
  /** The logo's orange as a light-to-deep gradient with a white glyph: where it should stand out. */
  solid: "bg-linear-to-br from-brand-mid to-brand text-white shadow-[0_4px_12px_rgba(221,67,1,0.28)]",
  /** White with an orange glyph, for tiles that sit on a dark or orange surface. */
  inverse: "bg-white text-brand shadow-[0_2px_6px_rgba(0,0,0,0.18)]",
};

/** An icon on a soft tinted rounded square, in one of the app's tones. */
export function IconTile({
  icon: Icon,
  size = "sm",
  look = "soft",
  tone = "brand",
  className = "",
}: {
  icon: LucideIcon;
  size?: keyof typeof tileSizes;
  look?: keyof typeof tileLooks;
  /** For the `soft` look. */
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${tileSizes[size]} ${look === "soft" ? softTones[tone] : tileLooks[look]} ${className}`}
    >
      <Icon />
    </span>
  );
}

/** Soft tints, so patients are easy to tell apart. */
const avatarTones: Record<AvatarTone, string> = {
  brand: "bg-linear-to-br from-[#ffeee4] to-[#ffd8c4] text-[#c2410c]",
  ink: "bg-linear-to-br from-[#eef3f4] to-[#dbe5e7] text-ink-mid",
  success: "bg-linear-to-br from-[#e3f4ef] to-[#c8e9df] text-[#0e6b5b]",
  rust: "bg-linear-to-br from-[#fde3d5] to-[#f9c4a8] text-[#9a3412]",
};

const avatarSizes = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-lg",
  xl: "size-18 text-2xl",
};

export function Avatar({
  initials,
  tone = "ink",
  size = "md",
  className = "",
}: {
  initials: string;
  tone?: AvatarTone;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${avatarTones[tone]} ${avatarSizes[size]} ${className}`}
    >
      {initials}
    </span>
  );
}

export function Card({
  id,
  className = "",
  flush = false,
  highlight = false,
  children,
}: {
  id?: string;
  className?: string;
  /** Ekaay's look, for anything the AI wrote: a thin orange frame and a warm corner. */
  highlight?: boolean;
  /** Drop the padding so rows can run edge to edge. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`min-w-0 rounded-xl shadow-card ${highlight ? "ekaay-frame" : "border border-line bg-card"} ${flush ? "overflow-hidden" : "p-4 sm:p-5"} ${className}`}
    >
      {children}
    </section>
  );
}

/** A card's title. With `tile`, its icon sits on a small tinted tile. */
export function CardTitle({
  icon: Icon,
  tile = false,
  tone = "brand",
  children,
}: {
  icon?: LucideIcon;
  tile?: boolean;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <h2 className={`flex items-center font-display text-base font-bold tracking-[-0.005em] text-ink ${tile ? "gap-2.5" : "gap-2"}`}>
      {Icon && tile ? <IconTile icon={Icon} tone={tone} /> : Icon ? <Icon aria-hidden className="size-4 text-brand" /> : null}
      {children}
    </h2>
  );
}

/** A count beside a title, as a small pill. */
export function Count({ value, tone = "brand" }: { value: number; tone?: "brand" | "neutral" }) {
  return (
    <span
      className={`min-w-6 rounded-full px-1.5 text-center text-xs font-bold tabular-nums leading-5 ${
        tone === "brand" ? "bg-brand text-white" : "bg-selected text-ink-mid"
      }`}
    >
      {value}
    </span>
  );
}

/** The heading row of a flush card: title, an optional count, and a link or action on the right. */
export function PanelHeader({
  icon,
  tone = "brand",
  title,
  count,
  action,
  description,
}: {
  icon?: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="border-b border-line px-4 pb-3 pt-3.5 sm:px-5">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle icon={icon} tile={Boolean(icon)} tone={tone}>
            {title}
          </CardTitle>
          {count ? <Count value={count} tone="neutral" /> : null}
        </div>
        {action}
      </div>
      {description ? <p className={`mt-1 text-[13px] text-body ${icon ? "sm:pl-[2.625rem]" : ""}`}>{description}</p> : null}
    </div>
  );
}

/** A section's link at the right of its title, such as "Full schedule ›". */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-bold text-brand hover:text-brand-strong">
      {children}
      <ChevronRight aria-hidden className="size-4" />
    </Link>
  );
}

/**
 * A titled block of a screen, as on the app's Home: the title in the display face above the
 * card, with a count, a quiet note or a "See all ›" link at the right.
 */
export function Section({
  id,
  title,
  count,
  meta,
  action,
  className = "",
  children,
}: {
  id?: string;
  title: ReactNode;
  count?: number;
  /** Quiet text at the right; ignored when there is an action. */
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`min-w-0 ${className}`}>
      <div className="mb-3 flex min-h-7 items-center justify-between gap-3 px-0.5">
        <h2 id={id ? `${id}-title` : undefined} className="flex min-w-0 items-center gap-2 font-display text-[19px] font-bold leading-6 tracking-[-0.01em] text-ink">
          <span className="truncate">{title}</span>
          {count ? <Count value={count} /> : null}
        </h2>
        {action ?? (meta ? <span className="shrink-0 text-[13px] text-muted">{meta}</span> : null)}
      </div>
      {children}
    </section>
  );
}

/**
 * The top of a screen. A tab's own screen gets the dark hero (`children` go under its title:
 * a search, filter pills). A screen opened from one (`back`) gets, on phones, the app's bar with
 * a round back button, its title appearing in the bar once the big one has scrolled away.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
  barTitle,
  barRight,
  refresh,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
  /** Phones: the short title in the bar; the screen's own title by default. */
  barTitle?: ReactNode;
  /** Phones: one small action at the right of the bar. */
  barRight?: ReactNode;
  /** Tab screens: a "check for updates" button by the bell on phones. */
  refresh?: boolean;
  children?: ReactNode;
}) {
  if (!back) {
    return (
      <div className="mb-6 lg:mb-7">
        <Hero title={title} description={description} eyebrow={eyebrow} actions={actions} refresh={refresh}>
          {children}
        </Hero>
      </div>
    );
  }

  return (
    <>
      <StackBar back={back} title={barTitle ?? title} revealId="page-title" right={barRight} />
      <header className="mb-5 mt-2 lg:mb-6 lg:mt-0">
        <BackLink href={back.href} label={back.label} />
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? <p className="mb-1 text-[13px] font-semibold text-brand">{eyebrow}</p> : null}
            <h1
              id="page-title"
              className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.015em] text-ink lg:text-[2rem]"
            >
              {title}
            </h1>
            {description ? <p className="mt-1.5 text-sm leading-relaxed text-body">{description}</p> : null}
          </div>
          {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div> : null}
        </div>
        {children}
      </header>
    </>
  );
}

/**
 * Filters along the top of a list, as pills that scroll sideways on phones. Links, so the
 * choice is in the address. `glass` for pills on a dark hero.
 */
export function FilterTabs({
  label,
  items,
  active,
  glass = false,
  className = "",
}: {
  label: string;
  items: { value: string; label: string; href: string; count?: number }[];
  active: string;
  glass?: boolean;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 ${className}`}>
      <div className="flex min-w-max gap-2">
        {items.map((item) => {
          const selected = active === item.value;
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={selected ? "true" : undefined}
              className={`chip ${glass ? "chip-glass" : ""}`}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums leading-4 ${
                    selected ? (glass ? "bg-ink/10" : "bg-white/20") : glass ? "bg-white/15" : "bg-selected"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** What a list says when it is empty: an icon on soft rings, a line on what goes here. */
export function EmptyState({
  icon: Icon,
  title,
  tone = "brand",
  children,
}: {
  icon?: LucideIcon;
  title?: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {Icon ? (
        <span aria-hidden className={`mb-4 inline-flex size-19 items-center justify-center rounded-full ${softTones[tone]}`}>
          <span className="inline-flex size-13.5 items-center justify-center rounded-full bg-card shadow-card [&>svg]:size-6">
            <Icon />
          </span>
        </span>
      ) : null}
      {title ? <p className="text-base font-bold text-ink">{title}</p> : null}
      <div className="mt-1 max-w-sm text-sm leading-relaxed text-body">{children}</div>
    </div>
  );
}

export const flagTone: Record<ResultFlag, Tone> = {
  normal: "success",
  borderline: "warning",
  high: "danger",
  low: "danger",
  pending: "neutral",
};

export const accessMeta: Record<AccessStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  active: { label: "Record open", tone: "success", icon: LockOpen },
  pending: { label: "Awaiting OTP", tone: "warning", icon: Clock },
  expired: { label: "Access expired", tone: "neutral", icon: TimerOff },
  revoked: { label: "Access revoked", tone: "neutral", icon: Ban },
  none: { label: "No access", tone: "neutral", icon: Lock },
};

export function AccessChip({ status }: { status: AccessStatus }) {
  const meta = accessMeta[status];
  return (
    <Chip tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Chip>
  );
}
