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

/**
 * The fold tab is a circle (12px) centred on the sidebar's right edge, half inside it. Outside, the
 * hairline curves out (7.5px), runs round the circle and curves back in; inside, the tab is the
 * sidebar's own glass. Drawn from the middle of the edge's 1px column (x 12.5), so the stroke lines
 * up with the hairline above and below it; the edge leaves a gap this tall. Closed along that
 * column, the path also clips the tab's glass to the part outside the sidebar.
 */
const TAB_HEIGHT = 36;
const TAB_WIDTH = 25;
const TAB_PATH = "M12.5 0A7.5 7.5 0 0 0 17.115 6.923A12 12 0 0 1 17.115 29.077A7.5 7.5 0 0 0 12.5 36";

/** The sidebar's right edge: a hairline down each side of the tab. */
const edge = {
  backgroundImage: "linear-gradient(var(--color-line), var(--color-line)), linear-gradient(var(--color-line), var(--color-line))",
  backgroundPosition: "right top, right bottom",
  backgroundSize: `1px calc(50% - ${TAB_HEIGHT / 2}px)`,
  backgroundRepeat: "no-repeat",
};

/** Remembered in a cookie, so the next page load is drawn at the right width straight away. */
function remember(collapsed: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Wide screens: the console's navigation down the left. The tab on its edge, halfway down, folds
 * it to a strip of icons (« ) and opens it again (»); so do the logo and "[". The name beside the
 * logo goes to Today. Names show beside the icons on hover while it is folded.
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
        style={edge}
        className={`flex h-full flex-col bg-white/40 px-4 pb-4 pt-5 backdrop-blur-[36px] backdrop-saturate-180 ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}
      >
        <div className="flex items-center p-1">
          {/* The logo folds and opens the sidebar, like the tab on its edge. */}
          <button
            type="button"
            onClick={toggle}
            aria-controls="sidebar"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-keyshortcuts="["
            title={collapsed ? undefined : "Collapse sidebar  ["}
            className="group relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-card shadow-[0_4px_14px_rgba(14,42,51,0.12)] ring-1 ring-line transition-[scale,box-shadow] duration-150 hover:shadow-[0_6px_18px_rgba(14,42,51,0.18)] active:scale-95"
          >
            <Image src="/logo-mark.png" alt="" width={24} height={21} priority />
            <Tip show={collapsed}>Expand sidebar</Tip>
          </button>
          {/* Folded, the name is hidden, so it leaves the tab order too; Today is still in the nav. */}
          <Link
            href="/"
            tabIndex={collapsed ? -1 : undefined}
            aria-hidden={collapsed || undefined}
            className={`rounded-lg leading-none ${fold(collapsed)}`}
          >
            <span className="block font-display text-base font-semibold tracking-[-0.01em] text-ink">HealthMatrix</span>
            <span className="mt-1 block text-xs font-medium text-muted">Doctor console</span>
          </Link>
        </div>

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
                  active ? "nav-active font-bold text-ink" : "font-semibold text-body hover:bg-white/50 hover:text-ink"
                }`}
              >
                <span
                  className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active ? "text-brand-deep" : "text-muted group-hover:text-ink"
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
            className={`group relative flex items-center rounded-2xl border transition-[padding,background-color,border-color,box-shadow] ${MOTION} ${
              collapsed ? "border-transparent bg-transparent p-0.75 shadow-none hover:bg-white/50" : "glass-small p-2.5 hover:bg-white/70"
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

      {/*
        Halfway down the sidebar's edge, a round tab of the same glass, half in and half out: « folds
        it, » opens it. The chevrons sit on the edge and turn as it moves. Where the tab crosses the
        edge the hairline stops, so the sidebar runs on into the tab without a seam.
      */}
      <button
        type="button"
        onClick={toggle}
        aria-controls="sidebar"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-keyshortcuts="["
        title={`${collapsed ? "Expand" : "Collapse"} sidebar  [`}
        style={{ top: `calc(50% - ${TAB_HEIGHT / 2}px)`, width: TAB_WIDTH, height: TAB_HEIGHT }}
        className="group absolute left-[calc(100%-13px)] text-muted outline-none transition-colors duration-150 hover:text-brand-deep focus-visible:text-brand-deep"
      >
        <span
          aria-hidden
          style={{ clipPath: `path("${TAB_PATH}")` }}
          className="absolute inset-0 bg-white/40 backdrop-blur-[36px] backdrop-saturate-180"
        />
        <svg aria-hidden viewBox={`0 0 ${TAB_WIDTH} ${TAB_HEIGHT}`} className="absolute inset-0 size-full overflow-visible">
          <path
            d={TAB_PATH}
            fill="none"
            className="stroke-line transition-[stroke,stroke-width] duration-150 group-focus-visible:stroke-brand group-focus-visible:stroke-2"
          />
        </svg>
        <ChevronsLeft
          aria-hidden
          className={`absolute left-1/2 top-1/2 size-3.5 -translate-1/2 transition-transform ${MOTION} ${collapsed ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}

/**
 * Phones: the app's floating dock of glass, the open tab's icon on a pane of orange-tinted glass,
 * with a raised round button in the middle. Access log is on the profile screen.
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
      <ul className="glass-dock pointer-events-auto relative grid h-17 w-full max-w-115 grid-cols-5 rounded-full px-1.5">
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
                    <span className="inline-flex size-14.5 items-center justify-center rounded-full border-4 border-canvas bg-linear-to-br from-brand-mid to-brand text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),var(--shadow-glow)] transition-transform active:scale-95">
                      <item.icon aria-hidden className="size-6.5" strokeWidth={2} />
                    </span>
                    <span className={`text-[11px] leading-3.5 ${active ? "font-bold text-brand-deep" : "font-medium text-muted"}`}>
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
                    className={`relative inline-flex h-7.5 w-12 items-center justify-center rounded-full border transition-colors ${
                      active ? "nav-active text-brand-deep" : "border-transparent text-muted"
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
                  <span className={`text-[11px] leading-3.5 ${active ? "font-bold text-brand-deep" : "font-medium text-muted"}`}>
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
