"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether an element is on screen. Animations that loop use it to stop once scrolled away, so a
 * long page isn't running a dozen timers nobody can see.
 */
export function useInView(ref: RefObject<Element | null>, { rootMargin = "0px", once = false } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && once) observer.disconnect();
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}
