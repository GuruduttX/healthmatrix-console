"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * On phones, a Join button that rises from the bottom once the hero's buttons scroll away, and
 * steps aside again when the closing call to action is on screen, so there's never two at once.
 */
export function MobileJoinBar() {
  const [inView, setInView] = useState({ hero: true, final: false });

  useEffect(() => {
    const targets = [document.getElementById("hero-cta"), document.getElementById("final-cta")];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const key = entry.target.id === "hero-cta" ? "hero" : "final";
        setInView((value) => ({ ...value, [key]: entry.isIntersecting }));
      }
    });
    targets.forEach((target) => target && observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const show = !inView.hero && !inView.final;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] transition-[translate,opacity] duration-500 ease-out sm:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="glass-panel flex items-center gap-3 rounded-full p-1.5 pl-5">
        <p className="min-w-0 flex-1 truncate text-sm font-bold">Ready when you are</p>
        <Link href="/register" tabIndex={show ? undefined : -1} className="btn btn-primary group">
          Join as a doctor
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
