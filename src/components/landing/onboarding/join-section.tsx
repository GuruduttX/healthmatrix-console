import { BadgeCheck, CalendarClock } from "lucide-react";

import { joinSteps } from "../content";
import { CarouselDots } from "../ui/carousel-dots";
import carousel from "../ui/carousel.module.css";
import { JoinLink } from "../ui/cta";
import { revealDelay } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";
import styles from "./join.module.css";

export function JoinSection() {
  return (
    <section id="join" className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-15 max-sm:py-5 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Getting started"
        title={
          <>
            Join in four steps.
            <br className="hidden sm:block" /> <span className="text-brand-deep">Open your hours the same day.</span>
          </>
        }
        lede="Everything happens online. Keep your medical registration number handy and you’re set."
      />

      <div className="relative mt-14 max-sm:mt-8 lg:mt-16">
        <span aria-hidden data-reveal className={styles.connector} />
        {/* A swipeable row on phones (carousel.module.css), with dots under it. */}
        <ol className={`${carousel.track} relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5`}>
          {joinSteps.map(({ title, text, fields }, index) => (
            <li
              key={title}
              data-reveal="scale"
              style={revealDelay(150 + index * 140)}
              className={`${styles.step} glass-panel flex flex-col rounded-3xl p-5 max-lg:items-center max-lg:text-center sm:p-6`}
            >
              <span className={styles.number}>{index + 1}</span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted">Step {index + 1} of 4</p>
              <h3 className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-body">{text}</p>
              <div className="mt-auto grid gap-1.5 pt-5 max-lg:w-full max-lg:text-left">
                {fields.map((field, fieldIndex) => (
                  <span key={field} className={`${styles.field} rounded-xl px-3 py-2 text-xs font-semibold text-muted`} style={{ animationDelay: `${index * 0.4 + fieldIndex * 0.15}s` }}>
                    {field}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <CarouselDots count={joinSteps.length} label="Joining steps" />
      </div>

      <div
        data-reveal
        style={revealDelay(200)}
        className="glass-panel mt-5 flex flex-col items-start gap-5 rounded-3xl p-5 max-sm:items-center max-sm:text-center sm:flex-row sm:items-center sm:p-6"
      >
        <span className="glass-dish size-14 shrink-0">
          <CalendarClock className="size-7 text-brand-deep" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-xl font-semibold tracking-[-0.02em] max-sm:justify-center">
            Then you’re in <BadgeCheck className="size-5 text-success" />
          </p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-body">Set your hours and turn on bookings. Patients find you in the HealthMatrix app.</p>
        </div>
        <JoinLink className="w-full sm:w-auto">Start with your mobile number</JoinLink>
      </div>
    </section>
  );
}
