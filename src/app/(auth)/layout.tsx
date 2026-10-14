import { FileSearch, KeyRound, Lock, Mic, Sparkles, Video } from "lucide-react";
import type { Viewport } from "next";
import Image from "next/image";

import { PulseLine } from "@/components/hero";
import { showOtpOnScreen } from "@/lib/otp-sender";

/** Phones: the browser's bars take the dark header's colour. */
export const viewport: Viewport = { themeColor: "#0b2129" };

const points: { icon: typeof KeyRound; title: string; text: string }[] = [
  {
    icon: KeyRound,
    title: "Opened only with the patient’s OTP",
    text: "No OTP, no access. Every view is logged and expires on its own.",
  },
  {
    icon: FileSearch,
    title: "The whole story in the first minute",
    text: "One timeline, Ekaay’s summary and trend charts, ready before the consult.",
  },
  {
    icon: Mic,
    title: "Prescriptions from a voice note or photo",
    text: "Ekaay drafts, checks allergies and interactions, and you sign.",
  },
];

/** What the console brings, as pills on the phone header, like the app's sign-in. */
const pills = [
  { icon: KeyRound, label: "OTP-only records" },
  { icon: Sparkles, label: "Ekaay summaries" },
  { icon: Video, label: "Video consults" },
];

/** The logo on a white tile, as on the app's sign-in. */
function LogoTile({ size }: { size: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] ${
        size === "lg" ? "size-15 rounded-[1.125rem]" : "size-11 rounded-lg"
      }`}
    >
      <Image src="/logo-mark.png" alt="" width={size === "lg" ? 38 : 28} height={size === "lg" ? 34 : 25} priority />
    </span>
  );
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-card lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:bg-canvas">
      {/* Wide screens: the console's promise beside the form. */}
      <aside className="hero-bg relative hidden flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex xl:px-16">
        <PulseLine className="right-10 top-28" />
        <div className="relative flex items-center gap-3">
          <LogoTile size="sm" />
          <span className="leading-none">
            <span className="block font-display text-lg font-bold tracking-[-0.01em]">HealthMatrix</span>
            <span className="mt-1 block text-xs font-medium text-white/60">Doctor console</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[2.125rem] font-bold leading-[1.15] tracking-[-0.015em]">
            Your patient’s history, already open when the consult starts.
          </p>
          <ul className="mt-10 flex flex-col gap-3">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="glass flex gap-3.5 rounded-2xl p-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-mid to-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">A Cloudspital and Holden joint venture. Powered by Ekaay.AI.</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phones: the brand on the dark header; the form's white sheet rides over its bottom. */}
        <header className="hero-bg relative overflow-hidden px-6 pb-16 pt-[calc(env(safe-area-inset-top)+2.5rem)] text-white lg:hidden">
          <PulseLine className="-right-3 top-[calc(env(safe-area-inset-top)+4rem)]" />
          <div className="relative mx-auto max-w-104">
            <LogoTile size="lg" />
            <p className="mt-4 font-display text-[2rem] font-bold leading-9.5">HealthMatrix</p>
            <p className="mt-1 text-[15px] font-medium leading-snug text-white/70">The doctor console. Patient records, opened with their OTP.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {pills.map(({ icon: Icon, label }) => (
                <li key={label} className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold">
                  <Icon aria-hidden className="size-3.5 text-brand-light" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <main className="relative -mt-8 flex flex-1 flex-col items-center rounded-t-[1.75rem] bg-card px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 lg:mt-0 lg:justify-center lg:rounded-none lg:bg-transparent lg:px-6 lg:py-10">
          <div className="w-full max-w-104">
            {/* Production with OTP_SHOW_CODE=true: say so plainly, so it is never mistaken for the real thing. */}
            {process.env.NODE_ENV === "production" && showOtpOnScreen() ? (
              <p role="note" className="mb-4 rounded-2xl bg-warning-soft px-3.5 py-2.5 text-[13px] font-semibold text-warning">
                Test mode. Sign-in codes are shown on screen, not sent by SMS. Use test data only.
              </p>
            ) : null}
            <div className="lg:rounded-3xl lg:border lg:border-line lg:bg-card lg:p-9 lg:shadow-raised">{children}</div>
            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock aria-hidden className="size-3" />
              Every record you open is logged for the patient
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
