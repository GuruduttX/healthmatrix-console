"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether an element is on screen. Animations that loop use it to stop once scrolled away, so a
 * long page isn't running a dozen timers nobody can see. `amount` asks for that share of the
 * element to be showing (0 = any of it), within the screen less `rootMargin`.
 */
export function useInView(ref: RefObject<Element | null>, { rootMargin = "0px", once = false, amount = 0 } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= amount - 0.01;
        setInView(visible);
        if (visible && once) observer.disconnect();
      },
      { rootMargin, threshold: amount > 0 ? [0, amount] : 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once, amount]);

  return inView;
}
