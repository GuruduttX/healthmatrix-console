import { Plus } from "lucide-react";

import { faqs } from "../content";
import { JoinLink } from "../ui/cta";
import { revealDelay } from "../ui/reveal";
import { SectionHeading } from "../ui/section-heading";
import styles from "./faq.module.css";

export function FaqSection() {
  return (
    <section id="faq" className="relative mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-4 py-15 max-sm:gap-8 max-sm:py-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHeading align="left" eyebrow="Questions" title="Good questions, clear answers." lede="What doctors ask us most before they join." />
        <div data-reveal style={revealDelay(240)} className="mt-8 hidden lg:block">
          <JoinLink />
        </div>
      </div>

      <div className={`${styles.faq} grid gap-3`}>
        {faqs.map(({ question, answer }, index) => (
          <details key={question} name="faq" data-reveal style={revealDelay(index * 70)} className={`${styles.item} glass-panel rounded-3xl`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-base font-bold sm:px-6 [&::-webkit-details-marker]:hidden">
              {question}
              <span className={`${styles.icon} grid size-8 shrink-0 place-items-center rounded-full bg-white/70 text-brand-deep ring-1 ring-line`}>
                <Plus className="size-4" />
              </span>
            </summary>
            <p className={`${styles.answer} px-5 pb-6 text-pretty text-[0.9375rem] leading-relaxed text-body sm:px-6`}>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
