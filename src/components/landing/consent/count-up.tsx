"use client";

import { useEffect, useRef, useState } from "react";

import { useInView } from "../hooks/use-in-view";
import { useReducedMotion } from "../hooks/use-reduced-motion";

/** A number that counts up from zero the first time it scrolls into view. */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const seen = useInView(element, { once: true, rootMargin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!seen || reduced) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [seen, reduced, value, duration]);

  return (
    <span ref={element} className="tabular-nums">
      {shown}
    </span>
  );
}
