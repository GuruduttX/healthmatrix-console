"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import styles from "./hero.module.css";

/** How far a layer follows the pointer: further for what sits nearer. */
const depth = (amount: number) => ({ "--depth": amount }) as CSSProperties;

/** The doctors in a glass arch, ringed by a slow orbit. Each layer leans toward the pointer by its depth. */
export function HeroVisual() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--px", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      element.style.setProperty("--py", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
    };
    const reset = () => {
      element.style.setProperty("--px", "0");
      element.style.setProperty("--py", "0");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div className={styles.visualWrap}>
      <div ref={stage} className={`${styles.stage} relative mx-auto h-84 w-full max-w-136 sm:h-136`}>
        <div aria-hidden className={styles.orbit}>
          <i />
          <i />
        </div>
        <div aria-hidden className={`${styles.layer} ${styles.arch}`} style={depth(10)} />
        <span aria-hidden className={`${styles.layer} glass-orb-peach right-[6%] top-[8%] size-14 sm:size-18`} style={depth(26)} />
        <span aria-hidden className={`${styles.layer} glass-orb-sky bottom-[22%] left-[2%] size-10 sm:size-12`} style={depth(30)} />

        <div className={`${styles.layer} absolute inset-x-[6%] bottom-0 top-[12%]`} style={depth(16)}>
          <Image src="/landing/doctors.png" alt="Two doctors in white coats" fill priority sizes="(min-width: 1024px) 34rem, 90vw" className={styles.doctors} />
        </div>
      </div>
    </div>
  );
}
