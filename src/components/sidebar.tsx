"use client";

import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ChevronsLeft,
  FileSignature,
  FlaskConical,
  History,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CheckNewButton } from "@/components/check-new-button";
import { useChrome } from "@/components/chrome";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { isFocusScreen } from "@/components/mobile-chrome";
import { SIDEBAR_COOKIE } from "@/lib/session";

/** `requests`: shows how many booking requests wait for an answer. */
const navItems: {
  href: string;
  label: string;
  icon: LucideIcon;
  also?: string[];
  short?: string;
  requests?: boolean;
}[] = [
  { href: "/", label: "Today", short: "Today", icon: CalendarClock, also: ["/consults", "/notifications"], requests: true },
  { href: "/schedule", label: "Schedule", short: "Schedule", icon: CalendarDays, requests: true },
  { href: "/patients", label: "Patients", short: "Patients", icon: Users },
  { href: "/prescriptions", label: "Prescriptions", short: "Rx", icon: FileSignature },
  { href: "/results", label: "Results", short: "Results", icon: FlaskConical },
  { href: "/access-log", label: "Access log", icon: History },
];

/** The phone tab that gets the raised centre button, like Ekaay in the app. */
const CENTER = "/patients";

function isActive(pathname: string, item: (typeof navItems)[number]) {
  if (item.href === "/") return pathname === "/" || item.also!.some((p) => pathname.startsWith(p));
  return pathname.startsWith(item.href);
}

const requestsLabel = (count: number) => `${count} booking ${count === 1 ? "request" : "requests"}`;

/** One easing and length for everything that moves when the sidebar folds, so it moves as one. */
const MOTION = "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

/** Text beside an icon: slides shut, and fades, as the sidebar folds to its icons. */
const fold = (collapsed: boolean, open = "ml-3 max-w-44") =>
  `overflow-hidden whitespace-nowrap transition-[max-width,margin,opacity] ${MOTION} ${collapsed ? "ml-0 max-w-0 opacity-0" : `${open} opacity-100`}`;

/** The name of an icon-only item, beside it on hover or keyboard focus while folded. */
function Tip({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-floating transition-[opacity,translate] duration-150 ${
        show ? "group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" : "hidden"
      }`}
    >
      {children}
    </span>
  );
}

/** Remembered in a cookie, so the next page load is drawn at the right width straight away. */
function remember(collapsed: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Wide screens: the console's navigation down the left. The round button on its edge, halfway
 * down, folds it to a strip of icons (« ) and opens it again (»); so does "[". Names show beside
 * the icons on hover while it is folded.
 */
export function Sidebar({ collapsed: initiallyCollapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { doctor, requests } = useChrome();
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  const toggle = useCallback(() => setCollapsed((was) => !was), []);

  useEffect(() => remember(collapsed), [collapsed]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "[" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (document.querySelector("dialog[open]")) return;
      // Only where the sidebar shows.
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      event.preventDefault();
      toggle();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    // The width animates here; the main column beside it grows and shrinks with it.
    <div
      className={`sticky top-0 z-30 hidden h-dvh shrink-0 transition-[width] lg:block print:hidden ${MOTION} ${collapsed ? "w-20" : "w-64"}`}
    >
      <aside
        id="sidebar"
        className={`flex h-full flex-col border-r border-line bg-card px-4 pb-4 pt-5 ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}
      >
        <Link href="/" className="group relative flex items-center rounded-2xl p-1">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-card shadow-[0_4px_14px_rgba(14,42,51,0.12)] ring-1 ring-line">
            <Image src="/logo-mark.png" alt="" width={24} height={21} priority />
          </span>
          <span className={`leading-none ${fold(collapsed)}`}>
            <span className="block font-display text-base font-bold tracking-[-0.01em] text-ink">HealthMatrix</span>
            <span className="mt-1 block text-xs font-medium text-muted">Doctor console</span>
          </span>
          <Tip show={collapsed}>HealthMatrix · Today</Tip>
        </Link>

        <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item);
            const badge = item.requests && requests ? requests : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-11 items-center rounded-2xl px-2 text-sm transition-colors ${
                  active ? "bg-brand-soft font-bold text-ink" : "font-semibold text-body hover:bg-surface hover:text-ink"
                }`}
              >
                <span
                  className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-brand text-white shadow-[0_4px_10px_rgba(221,67,1,0.3)]" : "text-muted group-hover:text-ink"
                  }`}
                >
                  <item.icon aria-hidden className="size-4.5" />
                  {/* Folded, the count rides on the icon instead. */}
                  {badge ? (
                    <span
                      aria-hidden
                      className={`absolute -right-1.5 -top-1.5 min-w-4.5 rounded-full bg-brand px-1 text-center text-[10px] font-bold leading-4.5 text-white ring-2 ring-card transition-[opacity,scale] ${MOTION} ${
                        collapsed ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span className={fold(collapsed)}>{item.label}</span>
                {badge ? (
                  <span className={`ml-auto shrink-0 ${fold(collapsed, "max-w-12")}`}>
                    <span className="block min-w-6 rounded-full bg-brand px-1.5 text-center text-[11px] font-bold tabular-nums leading-5 text-white">
                      {badge}
                    </span>
                  </span>
                ) : null}
                {badge ? <span className="sr-only">, {requestsLabel(badge)}</span> : null}
                <Tip show={collapsed}>
                  {item.label}
                  {badge ? ` · ${requestsLabel(badge)}` : ""}
                </Tip>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <CheckNewButton variant="sidebar" collapsed={collapsed} />
          <Link
            href="/profile"
            className={`group relative flex items-center rounded-2xl border transition-[padding,background-color,border-color,box-shadow] hover:bg-surface ${MOTION} ${
              collapsed ? "border-transparent bg-transparent p-0.75 shadow-none" : "border-line bg-card p-2.5 shadow-card"
            }`}
          >
            <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="md" />
            <span className={`min-w-0 flex-1 leading-tight ${fold(collapsed)}`}>
              <span className="block truncate text-[13px] font-bold text-ink">{doctor.name}</span>
              <span className="mt-0.5 block truncate text-xs text-body">{doctor.specialty}</span>
            </span>
            <ChevronRight
              aria-hidden
              className={`size-4 shrink-0 text-muted transition-[opacity,width] ${MOTION} ${collapsed ? "w-0 opacity-0" : "opacity-100"}`}
            />
            <Tip show={collapsed}>Profile and settings</Tip>
          </Link>
        </div>
      </aside>

      {/* Halfway down the sidebar's edge: « folds it, » opens it. The chevrons turn as it moves. */}
      <button
        type="button"
        onClick={toggle}
        aria-controls="sidebar"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-keyshortcuts="["
        title={`${collapsed ? "Expand" : "Collapse"} sidebar  [`}
        className="absolute -right-3.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-card text-muted shadow-card transition-[color,background-color,border-color,scale] duration-150 hover:scale-110 hover:border-brand/30 hover:bg-brand-soft hover:text-brand active:scale-95"
      >
        <ChevronsLeft aria-hidden className={`size-4 transition-transform ${MOTION} ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

/**
 * Phones: the app's floating pill tab bar, with a raised round button in the middle. Access log
 * is on the profile screen.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { requests } = useChrome();
  // Focus screens have their own action bar along the bottom.
  if (isFocusScreen(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden print:hidden"
    >
      <ul className="pointer-events-auto relative grid h-17 w-full max-w-115 grid-cols-5 rounded-full border border-line-strong bg-card/95 px-1.5 shadow-floating backdrop-blur-xl backdrop-saturate-150">
        {navItems
          .filter((item) => item.short)
          .map((item) => {
            const active = isActive(pathname, item);
            const badge = item.requests && requests ? requests : 0;
            const label = badge ? `${item.label}, ${requestsLabel(badge)}` : item.label;

            if (item.href === CENTER) {
              return (
                <li key={item.href} className="relative flex justify-center">
                  <Link
                    href={item.href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className="absolute -top-4.75 flex flex-col items-center gap-1"
                  >
                    <span className="inline-flex size-14.5 items-center justify-center rounded-full border-4 border-canvas bg-linear-to-br from-brand-mid to-brand text-white shadow-glow transition-transform active:scale-95">
                      <item.icon aria-hidden className="size-6.5" strokeWidth={2} />
                    </span>
                    <span className={`text-[11px] leading-3.5 ${active ? "font-bold text-brand" : "font-medium text-muted"}`}>
                      {item.short}
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="flex w-full flex-col items-center justify-center gap-0.5"
                >
                  <span
                    className={`relative inline-flex h-7.5 w-12 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-brand-soft text-brand" : "text-muted"
                    }`}
                  >
                    <item.icon aria-hidden className="size-5.5" strokeWidth={active ? 2.4 : 2} />
                    {badge ? (
                      <span
                        aria-hidden
                        className="absolute -top-1 right-0.5 min-w-4.5 rounded-full bg-brand px-1 text-center text-[10px] font-bold leading-4.5 text-white ring-2 ring-card"
                      >
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[11px] leading-3.5 ${active ? "font-bold text-brand" : "font-medium text-muted"}`}>
                    {item.short}
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
