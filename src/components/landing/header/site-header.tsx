"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { nav } from "../content";
import { Brand } from "../ui/brand";
import styles from "./site-header.module.css";

/**
 * Clear over the hero, then a bar of glass once the page moves. The link for the section on
 * screen stays lit, and a thin line along the bottom shows how far down the page you are.
 */
function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function SiteHeader() {
  const scrolled = useSyncExternalStore(subscribeToScroll, () => window.scrollY > 12, () => false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const sections = nav.map(({ href }) => document.querySelector(href)).filter((section) => section !== null);
    // A section counts as current while it crosses the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(`#${entry.target.id}`);
          else setCurrent((value) => (value === `#${entry.target.id}` ? null : value));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top)+0.625rem)] sm:px-5">
      <div
        data-scrolled={scrolled || open || undefined}
        className={`${styles.bar} relative mx-auto flex max-w-6xl items-center gap-4 rounded-full py-2 pl-4 pr-2 sm:pl-5`}
      >
        <Link href="/welcome" aria-label="HealthMatrix home" className="shrink-0">
          <Brand />
        </Link>

        <nav aria-label="Sections" className="mx-auto hidden items-center gap-1 lg:flex">
          {nav.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              aria-current={current === href ? "true" : undefined}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-body transition-colors hover:text-ink aria-[current]:bg-white/70 aria-[current]:text-ink aria-[current]:shadow-(--glass-shadow-flat)"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href="/login" className="btn btn-sm btn-ghost hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-sm btn-primary group hidden sm:inline-flex">
            Join now
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="btn btn-sm btn-icon btn-frost lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <span aria-hidden className={styles.progress} />
      </div>

      {open ? (
        <nav id="landing-menu" aria-label="Sections" className={`${styles.menu} glass-panel mx-auto mt-2 max-w-6xl rounded-3xl p-3 lg:hidden`}>
          {nav.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold hover:bg-white/60">
              {label}
              <ArrowRight aria-hidden className="size-4 text-muted" />
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary">
              Join now
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
