import { JoinLink, SignInLink } from "../ui/cta";
import { revealDelay } from "../ui/reveal";
import { Eyebrow } from "../ui/section-heading";
import styles from "./final-cta.module.css";

export function FinalCta() {
  return (
    <section id="final-cta" className="relative mx-auto max-w-6xl px-4 py-15 max-sm:py-5 sm:px-6 lg:px-8">
      <div data-reveal="scale" className={`${styles.panel} glass-panel relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 lg:py-24`}>
        <div aria-hidden className={styles.glow} />
        <div className="relative">
          <Eyebrow>The next step is simple</Eyebrow>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance font-display text-[2.375rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            Bring your expertise. <span className={styles.accent}>We’ll bring the whole picture.</span>
          </h2>
          <p data-reveal style={revealDelay(150)} className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-body sm:text-lg">
            Set up your doctor profile in four steps. Already with HealthMatrix? Sign in with your mobile number.
          </p>
          <div data-reveal style={revealDelay(250)} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <JoinLink className="w-full sm:w-auto" />
            <SignInLink className="w-full sm:w-auto">Sign in to your console</SignInLink>
          </div>
        </div>
      </div>
    </section>
  );
}
