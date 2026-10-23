import type { ReactNode } from "react";

/** A patient's initials in a warm round, as the console's patient rows. */
export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-[0.6875rem]", md: "size-10 text-xs", lg: "size-16 text-lg" };
  return <span className={`grid shrink-0 place-items-center rounded-full bg-[#f3dfcf] font-display font-bold text-[#92644b] ${sizes[size]}`}>{initials}</span>;
}

const tones = {
  neutral: "bg-selected text-body",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand-deep",
} as const;

/** A small status chip in one of the console's flag colours. */
export function Flag({ tone = "neutral", children, className = "" }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${tones[tone]} ${className}`}>{children}</span>;
}

/** The console's switch, sliding on. */
export function Toggle({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors duration-500 ${on ? "bg-success" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-500 ${on ? "left-4.5" : "left-0.5"}`} />
    </span>
  );
}

/** A soft white card inside a preview: no backdrop blur, since the frame already is glass. */
export const tile = "rounded-2xl border border-white bg-white/75 shadow-[0_1px_2px_rgba(30,50,70,0.05),0_0_0_1px_rgba(44,72,96,0.06)]";
