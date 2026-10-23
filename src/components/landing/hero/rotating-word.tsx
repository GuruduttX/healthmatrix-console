"use client";

import { heroWords } from "../content";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useSequence } from "../hooks/use-sequence";
import styles from "./hero.module.css";

const beats = heroWords.map(() => 2400);

/** One of the hero's words at a time, each rolling up into place with a stroke drawn under it. */
export function RotatingWord() {
  const step = useSequence(beats, true);
  // With motion off the sequence rests on its last step; hold the first word instead.
  const word = useReducedMotion() ? heroWords[0] : heroWords[step];

  return (
    <span className={styles.rotator}>
      <span key={word} className={styles.rotatorWord}>
        {word}
        <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className={styles.squiggle}>
          <path d="M2 8 C 40 2, 80 12, 120 6 S 180 4, 198 7" />
        </svg>
      </span>
      .
    </span>
  );
}
