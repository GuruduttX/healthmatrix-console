"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { canGoBackInConsole } from "@/components/chrome";
import { bleed } from "@/components/hero";

/**
 * Back like an app's: to the console screen the doctor came from, or up to `href` when the
 * screen was opened on its own (a link, a reload). A plain link without script.
 */
export function BackButton({
  href,
  label,
  tone = "light",
  onBack,
}: {
  href: string;
  /** Where `href` goes, for screen readers when there is no history to go back to. */
  label: string;
  tone?: "light" | "dark";
  /** In place of going back, e.g. to ask before leaving unsaved changes. */
  onBack?: () => void;
}) {
  const router = useRouter();

  function back(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    if (onBack) onBack();
    else if (canGoBackInConsole()) router.back();
    else router.push(href);
  }

  return (
    <Link
      href={href}
      onClick={back}
      aria-label={`Back to ${label}`}
      className={`btn btn-icon size-11 min-h-11 shrink-0 ${tone === "dark" ? "btn-glass" : "btn-secondary shadow-card"}`}
    >
      <ChevronLeft aria-hidden className="size-5.5" />
    </Link>
  );
}

/**
 * Phones: the bar at the top of a screen opened from a tab, as in the app: a round back
 * button, a short title and one action. It stays at the top while the screen scrolls, frosted
 * once there is something under it. With `revealId`, the title shows only after the screen's
 * own big title (that element) has scrolled away. `dark` lies over a dark header, which then
 * starts under the bar: the bar is 3.75rem tall below the status bar.
 */
export function StackBar({
  back,
  title,
  revealId,
  right,
  tone = "light",
  onBack,
}: {
  back: { href: string; label: string };
  title?: ReactNode;
  revealId?: string;
  right?: ReactNode;
  tone?: "light" | "dark";
  onBack?: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(!revealId);
  const dark = tone === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const target = revealId ? document.getElementById(revealId) : null;
    if (!target) return;
    // Hidden once the big title has gone up under the bar.
    const observer = new IntersectionObserver(([entry]) => setRevealed(!entry.isIntersecting && entry.boundingClientRect.top < 80), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [revealId]);

  const surface = scrolled
    ? dark
      ? "bg-ink/92 backdrop-blur-xl backdrop-saturate-150"
      : "bg-canvas/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl backdrop-saturate-150"
    : "";

  return (
    <div
      className={`sticky top-0 z-30 flex items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] transition-[background-color,box-shadow] duration-200 sm:px-6 lg:hidden print:hidden ${bleed} ${surface} ${
        dark ? "-mb-[calc(env(safe-area-inset-top)+3.75rem)] text-white" : "text-ink"
      }`}
    >
      <BackButton href={back.href} label={back.label} tone={tone} onBack={onBack} />
      <p
        aria-hidden={!revealed}
        className={`min-w-0 flex-1 truncate text-center text-base font-bold transition-opacity duration-200 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        {title}
      </p>
      {/* As wide as the back button, so the title stays centred. */}
      <div className="flex min-w-11 shrink-0 justify-end">{right}</div>
    </div>
  );
}

/**
 * Wide screens: the way back above a screen's title. Phones use the bar's round button instead,
 * so it shows from `lg` up only. (Its display lives here alone: a `hidden` passed in from outside
 * would lose to an `inline-flex` in here.)
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group -ml-1 mb-3 hidden w-fit items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold text-body transition-colors hover:bg-card hover:text-ink lg:flex print:hidden"
    >
      <span className="inline-flex size-6 items-center justify-center rounded-full border border-line-strong bg-card shadow-card">
        <ChevronLeft aria-hidden className="size-4" />
      </span>
      {label}
    </Link>
  );
}
