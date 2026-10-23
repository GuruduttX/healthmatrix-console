"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The dots under a phone carousel (carousel.module.css): one per card, the current one drawn
 * long. Place it straight after the row it follows. Tapping a dot slides to that card. Phones only.
 */
export function CarouselDots({ count, label }: { count: number; label: string }) {
  const dots = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const track = () => dots.current?.previousElementSibling as HTMLElement | null;

  useEffect(() => {
    const row = dots.current?.previousElementSibling as HTMLElement | null;
    if (!row) return;
    const onScroll = () => {
      const first = row.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step = first.offsetWidth + (parseFloat(getComputedStyle(row).columnGap) || 0);
      // The last card can't snap to the left edge, so reaching the end counts as reaching it.
      const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2;
      setActive(atEnd ? count - 1 : Math.min(count - 1, Math.round(row.scrollLeft / step)));
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, [count]);

  const show = (index: number) => {
    const row = track();
    const card = row?.children[index] as HTMLElement | undefined;
    if (!row || !card) return;
    row.scrollTo({ left: card.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: "smooth" });
  };

  return (
    <div ref={dots} role="group" aria-label={label} className="mt-4 flex items-center justify-center gap-2 sm:hidden">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => show(index)}
          aria-label={`Show card ${index + 1} of ${count}`}
          aria-current={index === active || undefined}
          className={`relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-2.5 before:content-[""] ${index === active ? "w-6 bg-brand" : "w-2 bg-line-strong"}`}
        />
      ))}
    </div>
  );
}
