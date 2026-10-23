import type { CSSProperties } from "react";
import { CalendarCheck, ShieldCheck, Stethoscope } from "lucide-react";

import { heroWords } from "../content";
import { JoinLink, SignInLink } from "../ui/cta";
import { Eyebrow } from "../ui/section-heading";
import { HeroVisual } from "./hero-visual";
import { RotatingWord } from "./rotating-word";
import styles from "./hero.module.css";

/** The headline, a line per row, each word numbered for its beat; the last word is in orange. */
const headline = [
  ["The", "whole", "patient,"],
  ["before", "you", "say", "hello."],
].map((line, row) => line.map((word, column) => ({ word, beat: row * 3 + column, accent: word === "hello." })));

const assurances = [
  { icon: ShieldCheck, label: "Records open only with patient OTP" },
  { icon: CalendarCheck, label: "Your hours, your bookings" },
  { icon: Stethoscope, label: "For registered practitioners" },
] as const;

export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-15 pt-24 max-lg:text-center max-sm:pb-5 sm:px-6 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-8 lg:pt-36">
      <div className="relative z-10">
        <div className={styles.fadeIn}>
          <Eyebrow>The doctor console by HealthMatrix</Eyebrow>
        </div>

        <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[clamp(2.75rem,4vw,3.5rem)]">
          {headline.map((line) => (
            <span key={line[0].word} className="block">
              {line.map(({ word, beat, accent }) => (
                // Each word rises in on its own beat (`--i`).
                <span key={word} className={`${styles.word} ${accent ? styles.accent : ""}`} style={{ "--i": beat } as CSSProperties}>
                  {word}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p className={`${styles.fadeIn} mt-5 font-display text-lg font-medium tracking-[-0.02em] text-ink-mid sm:text-xl`} style={{ animationDelay: "650ms" }}>
          <span className="sr-only">One calm console for your {heroWords.join(", ")}.</span>
          <span aria-hidden>
            One calm console for your <RotatingWord />
          </span>
        </p>

        <p className={`${styles.fadeIn} mt-3 max-w-xl text-pretty max-lg:mx-auto text-[0.9375rem] leading-relaxed text-body sm:text-base`} style={{ animationDelay: "750ms" }}>
          Bookings, consented records, Ekaay, video consults and prescriptions in one workspace, so every consult starts with the full story and ends with a clear next step.
        </p>

        <div id="hero-cta" className={`${styles.fadeIn} mt-7 flex flex-wrap items-center gap-3 max-lg:justify-center max-sm:flex-col max-sm:items-stretch`} style={{ animationDelay: "850ms" }}>
          <JoinLink className="max-sm:w-full" />
          <SignInLink className="max-sm:w-full">I have an account</SignInLink>
        </div>

        <ul className={`${styles.fadeIn} mt-6 flex flex-wrap gap-x-5 gap-y-2.5 max-lg:justify-center text-[0.8125rem] font-semibold text-body`} style={{ animationDelay: "950ms" }}>
          {assurances.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <Icon aria-hidden className="size-4 text-success" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <HeroVisual />
    </section>
  );
}
