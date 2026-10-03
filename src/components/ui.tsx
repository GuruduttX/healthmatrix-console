import type { LucideIcon } from "lucide-react";
import { Clock, Lock, LockOpen, TimerOff } from "lucide-react";
import type { ReactNode } from "react";

import type { AccessStatus, AvatarTone, ResultFlag, Tone } from "@/lib/types";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand",
  neutral: "bg-selected text-body",
};

export function Chip({
  tone = "neutral",
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
      {children}
    </span>
  );
}

const avatarTones: Record<AvatarTone, string> = {
  brand: "bg-brand-mid",
  ink: "bg-ink-mid",
  success: "bg-success",
  rust: "bg-danger",
};

const avatarSizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

export function Avatar({
  initials,
  tone = "ink",
  size = "md",
}: {
  initials: string;
  tone?: AvatarTone;
  size?: keyof typeof avatarSizes;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarTones[tone]} ${avatarSizes[size]}`}
    >
      {initials}
    </span>
  );
}

export function Card({
  className = "",
  flush = false,
  highlight = false,
  children,
}: {
  className?: string;
  /** Peach surface for anything Ekaay wrote. */
  highlight?: boolean;
  /** Drop the padding so rows can run edge to edge. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border shadow-card ${highlight ? "border-brand-light bg-brand-soft" : "border-line bg-card"} ${flush ? "overflow-hidden" : "p-5"} ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
      {Icon ? <Icon aria-hidden className="size-4 text-brand" /> : null}
      {children}
    </h2>
  );
}

export const flagTone: Record<ResultFlag, Tone> = {
  normal: "success",
  borderline: "warning",
  high: "danger",
  low: "danger",
  pending: "neutral",
};

const accessMeta: Record<AccessStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  active: { label: "Record open", tone: "success", icon: LockOpen },
  pending: { label: "Awaiting OTP", tone: "warning", icon: Clock },
  expired: { label: "Access expired", tone: "neutral", icon: TimerOff },
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
