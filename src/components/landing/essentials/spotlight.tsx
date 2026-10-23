"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Lights the card under the pointer from where the pointer is, and leans it toward it a little.
 * One listener for the whole grid; the cards themselves stay server-rendered (`data-spot`).
 */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const last = useRef<HTMLElement | null>(null);

  const reset = (card: HTMLElement | null) => {
    card?.style.setProperty("--rx", "0deg");
    card?.style.setProperty("--ry", "0deg");
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-spot]");
    if (card !== last.current) {
      reset(last.current);
      last.current = card;
    }
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mx", `${x}px`);
    card.style.setProperty("--my", `${y}px`);
    card.style.setProperty("--rx", `${((y / rect.height - 0.5) * -4).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${((x / rect.width - 0.5) * 4).toFixed(2)}deg`);
  };

  return (
    <div
      className={className}
      onPointerMove={move}
      onPointerLeave={() => {
        reset(last.current);
        last.current = null;
      }}
    >
      {children}
    </div>
  );
}
