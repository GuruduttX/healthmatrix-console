"use client";

import { useEffect } from "react";

/**
 * Marks each `[data-reveal]` on the page `data-shown` as it scrolls into view, which lets CSS
 * (landing.module.css) ease it in. One observer for the whole page keeps every section a Server
 * Component. Whatever is already on screen when this runs is shown at once, so nothing blinks.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    for (const element of root.querySelectorAll("[data-reveal]")) {
      const { top, bottom } = element.getBoundingClientRect();
      if (top < window.innerHeight && bottom > 0) element.setAttribute("data-shown", "");
      else observer.observe(element);
    }
    root.setAttribute("data-reveal-ready", "");

    return () => observer.disconnect();
  }, []);

  return null;
}
