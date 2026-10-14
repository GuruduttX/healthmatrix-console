"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { bleed } from "@/components/hero";

/**
 * Phones: pills under the bar that jump to each part of a long screen, the one in view marked.
 * Sections missing from the page (no vaccines, say) are left out.
 */
export function JumpNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [present, setPresent] = useState(items);
  const [active, setActive] = useState(items[0]?.id);
  const strip = useRef<HTMLDivElement>(null);
  /** While a tap's smooth scroll runs, the tapped pill stays marked. */
  const jumping = useRef(false);

  useEffect(() => {
    const found = items.filter((item) => document.getElementById(item.id));
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- which sections exist is only known in the page */
    setPresent(found);
    const targets = found.map((item) => document.getElementById(item.id)!);
    // A section counts as in view while it crosses a line a third of the way down the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumping.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-33% 0px -66% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [items]);

  // Keeps the marked pill in sight as the strip scrolls sideways.
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>(`[data-id="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  function jump(event: MouseEvent, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    setActive(id);
    jumping.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => (jumping.current = false), 700);
  }

  if (present.length < 2) return null;

  return (
    <nav
      aria-label={label}
      className={`sticky top-[calc(env(safe-area-inset-top)+3.75rem)] z-20 mb-4 bg-canvas/85 py-2 backdrop-blur-xl backdrop-saturate-150 lg:hidden print:hidden ${bleed}`}
    >
      <div ref={strip} className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:px-6">
        {present.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-id={item.id}
            onClick={(event) => jump(event, item.id)}
            aria-current={active === item.id ? "true" : undefined}
            className="chip min-h-9 shrink-0 px-3.5 text-[13px]"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
