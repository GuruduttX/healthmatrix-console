import { Sparkle } from "lucide-react";

import { marqueeRows } from "../content";
import styles from "./feature-marquee.module.css";

/**
 * Two bands of what the console does, drifting in opposite directions. Each band is drawn twice
 * end to end so the loop never shows a seam; the copy is hidden from screen readers.
 */
export function FeatureMarquee() {
  return (
    <section aria-label="What the console does" className={`${styles.marquee} relative py-4 sm:py-10`}>
      {marqueeRows.map((row, index) => (
        <div key={row[0]} className={styles.row} data-reverse={index % 2 === 1 || undefined}>
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined} className={styles.track}>
              {row.map((item) => (
                <li key={item} className="glass-pill inline-flex shrink-0 items-center gap-2.5 px-5 py-3 text-sm font-semibold text-ink-mid sm:text-[0.9375rem]">
                  <Sparkle aria-hidden className="size-3.5 text-brand-mid" />
                  {item}
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </section>
  );
}
