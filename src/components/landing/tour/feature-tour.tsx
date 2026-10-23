"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import { chapters } from "../content";
import { useInView } from "../hooks/use-in-view";
import { ConsoleFrame } from "./console-frame";
import styles from "./tour.module.css";

/**
 * Six chapters of a consulting day. On wide screens the copy scrolls past a console window that
 * stays put and switches to whichever chapter crosses the middle of the screen; on phones each
 * chapter carries its own window. Only the chapter in the middle plays its preview.
 */
export default function FeatureTour() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const tour = useRef<HTMLDivElement>(null);
  const inView = useInView(tour);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={tour} className="mt-14 grid gap-10 max-lg:grid-cols-[minmax(0,1fr)] max-sm:mt-6 lg:mt-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <ol className="relative">
        <span aria-hidden className={`${styles.track} max-lg:hidden`}>
          <span className={styles.trackFill} style={{ scale: `1 ${(active + 1) / chapters.length}` }} />
        </span>
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            ref={(item) => {
              items.current[index] = item;
            }}
            data-index={index}
            data-active={index === active || undefined}
            className={`${styles.chapter} relative flex flex-col justify-center py-10 max-sm:py-5 max-lg:items-center max-lg:text-center lg:min-h-[78vh] lg:py-0 lg:pl-14`}
          >
            <span aria-hidden className={styles.node}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-deep">{chapter.eyebrow}</p>
            <h3 className="mt-3 text-balance font-display text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-4xl">{chapter.title}</h3>
            <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-body max-lg:mx-auto">{chapter.text}</p>
            <ul className="mt-5 grid gap-2.5 max-lg:w-full max-lg:rounded-3xl max-lg:border max-lg:border-white max-lg:bg-white/55 max-lg:p-4 max-lg:text-left max-lg:shadow-(--glass-shadow-flat)">
              {chapter.points.map((point, pointIndex) => (
                <li key={point} className={`${styles.point} flex items-start gap-2.5 text-[0.9375rem] font-semibold text-ink-mid`} style={{ transitionDelay: `${pointIndex * 90}ms` }}>
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <Check className="size-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 w-full text-left lg:hidden">
              <ConsoleFrame chapter={chapter.id} play={inView && index === active} />
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[max(5.5rem,calc(50vh-15.5rem))]">
          <div className={styles.glow} aria-hidden />
          <ConsoleFrame chapter={chapters[active].id} play={inView} />
          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden>
            {chapters.map((chapter, index) => (
              <span key={chapter.id} className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? "w-8 bg-brand" : "w-1.5 bg-line-strong"}`} />
            ))}
          </div>
          <p className="mt-3 text-center text-[0.6875rem] font-semibold text-muted">Illustrative preview · no real patient data</p>
        </div>
      </div>
    </div>
  );
}
