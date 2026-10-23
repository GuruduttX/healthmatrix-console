import type { CSSProperties } from "react";
import { FolderOpen, KeyRound, LockKeyhole, Send } from "lucide-react";

import { consentSteps, consentStats } from "../content";
import { revealDelay } from "../ui/reveal";
import { Eyebrow } from "../ui/section-heading";
import { CountUp } from "./count-up";
import styles from "./consent.module.css";

const stepIcons = [Send, KeyRound, FolderOpen, LockKeyhole];

export function ConsentSection() {
  return (
    <section id="consent" className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-15 max-sm:py-5 sm:px-6 lg:px-8">
      <div data-reveal="scale" className={`${styles.panel} glass-panel overflow-hidden rounded-[2.5rem] px-5 py-12 sm:px-10 lg:px-16 lg:py-16`}>
        <div aria-hidden className={styles.shield} />

        <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div className="max-lg:text-center">
            <Eyebrow>Consent, built in</Eyebrow>
            <h2 className="mt-5 text-balance font-display text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Their story. <span className="text-brand-deep">Shared on their terms.</span>
            </h2>
            <p className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-body max-lg:mx-auto sm:text-lg">
              A patient’s full history never opens without them. They share it with a code, for a day, and see every time it was opened. That trust is why they’ll share it with you.
            </p>
          </div>

          <ol className={styles.journey}>
            <span aria-hidden className={styles.rail}>
              <span className={styles.spark} />
            </span>
            {consentSteps.map(({ title, text }, index) => {
              const Icon = stepIcons[index];
              return (
                <li key={title} className={styles.step} style={{ "--n": index } as CSSProperties}>
                  <span className={styles.node}>
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-bold">{title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-body">{text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative mt-12 grid gap-3 max-sm:grid-cols-3 max-sm:gap-2 sm:grid-cols-3 lg:mt-16">
          {consentStats.map(({ value, unit, label }, index) => (
            <div key={unit} data-reveal style={revealDelay(index * 120)} className="rounded-3xl border border-white bg-white/55 px-6 py-5 max-lg:text-center max-sm:rounded-2xl max-sm:px-2 max-sm:py-4">
              <p className="font-display text-5xl font-semibold tracking-[-0.04em] text-ink max-sm:text-[2rem] max-sm:leading-none">
                <CountUp value={value} />
                <span className="ml-1.5 text-xl font-semibold text-brand-deep max-sm:mt-1 max-sm:ml-0 max-sm:block max-sm:text-sm max-sm:tracking-normal">{unit}</span>
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-body max-sm:text-[0.6875rem]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
