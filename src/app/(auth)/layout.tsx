import { FileSearch, KeyRound, Lock, Mic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import styles from "@/components/auth/auth-shell.module.css";

import { IconTile } from "@/components/ui";
import { showOtpOnScreen } from "@/lib/otp-sender";

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

/** The logo on a tile of bright glass, as on the app's sign-in: nearly opaque, so the page's peach never shows under the orange. */
function LogoTile({ size }: { size: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border border-(--glass-rim) bg-white/90 shadow-[var(--glass-glow-small),var(--glass-shadow-small)] ${
        size === "lg" ? "size-16 rounded-xl" : "size-11 rounded-lg"
      }`}
    >
      <Image src="/logo-mark.png" alt="" width={size === "lg" ? 38 : 28} height={size === "lg" ? 34 : 25} priority />
    </span>
  );
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`${styles.shell} grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`}>
      {/* Wide screens: the console's promise beside the form, straight on the page with the light behind. */}
      <aside className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <LogoTile size="sm" />
          <span className="leading-none">
            <span className="block font-display text-lg font-semibold tracking-[-0.01em] text-ink">HealthMatrix</span>
            <span className="mt-1 block text-xs font-medium text-muted">Doctor console</span>
          </span>
        </div>

        <div className="max-w-md">
          <p className="font-display text-[2.125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
            Your patient’s history, already open when the consult starts.
          </p>
          <ul className="mt-10 flex flex-col gap-6">
            {points.map(({ icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <IconTile icon={icon} size="md" />
                <div>
                  <p className="text-sm font-bold text-ink">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-body">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted">A Cloudspital and Holden joint venture. Powered by Ekaay.AI.</p>
      </aside>

      {/* The brand and the form sit together a little above the middle, as on the app's sign-in. */}
      <div className={`${styles.formColumn} flex min-w-0 flex-col justify-center px-5 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-6 lg:py-10`}>
        {/* Phones: the brand on the page, above the form's pane of glass. */}
        <header className={styles.mobileHeader}><Link href="/welcome" aria-label="Back to welcome"><ArrowLeft size={20} /></Link><span>HEALTHMATRIX <small>FOR DOCTORS</small></span><ShieldCheck size={21} /></header>
        <div className={styles.mobileArtwork} aria-hidden="true"><span className={styles.artHalo} /><Image src="/landing/doctors.png" width={320} height={300} priority alt="" /><span className={styles.artBadge}><ShieldCheck size={15} /> Your care. Connected.</span></div>

        <main className={`${styles.formMain} mx-auto w-full max-w-104`}>
          {/* Production with OTP_SHOW_CODE=true: say so plainly, so it is never mistaken for the real thing. */}
          {process.env.NODE_ENV === "production" && showOtpOnScreen() ? (
            <p role="note" className="mb-4 rounded-2xl bg-warning-soft px-3.5 py-2.5 text-[13px] font-semibold text-warning">
              Test mode. Sign-in codes are shown on screen, not sent by SMS. Use test data only.
            </p>
          ) : null}
          {/* The one pane on the page. */}
          <div className={`${styles.formSheet} glass-panel rounded-2xl p-5 sm:p-7 lg:p-9`}><span className={styles.sheetHandle} aria-hidden="true" />{children}</div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock aria-hidden className="size-3" />
            Every record you open is logged for the patient
          </p>
        </main>
      </div>
    </div>
  );
}
