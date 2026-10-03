"use client";

import {
  CalendarClock,
  CalendarDays,
  FileSignature,
  FlaskConical,
  History,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { doctor } from "@/lib/data";

const navItems: { href: string; label: string; icon: LucideIcon; also?: string[]; short?: string }[] = [
  { href: "/", label: "Today", short: "Today", icon: CalendarClock, also: ["/consults"] },
  { href: "/schedule", label: "Schedule", short: "Schedule", icon: CalendarDays },
  { href: "/patients", label: "Patients", short: "Patients", icon: Users },
  { href: "/prescriptions", label: "Prescriptions", short: "Rx", icon: FileSignature },
  { href: "/results", label: "Results", short: "Results", icon: FlaskConical },
  { href: "/access-log", label: "Access log", icon: History },
];

function isActive(pathname: string, item: (typeof navItems)[number]) {
  if (item.href === "/") return pathname === "/" || item.also!.some((p) => pathname.startsWith(p));
  return pathname.startsWith(item.href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto bg-ink px-4 py-6 text-white lg:flex">
      <Link href="/" className="flex items-center gap-3 rounded-lg px-2">
        <Image src="/logo-mark.png" alt="" width={34} height={30} priority />
        <span className="leading-none">
          <span className="block font-display text-xl font-bold">HealthMatrix</span>
          <span className="mt-1 block text-xs font-medium text-white/60">Doctor console</span>
        </span>
      </Link>

      <nav aria-label="Main" className="mt-10 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon aria-hidden className={`size-4.5 ${active ? "text-brand-light" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-white/5 p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck aria-hidden className="size-4 text-brand-light" />
          No OTP, no access
        </p>
        <p className="mt-2 text-xs leading-relaxed text-white/65">
          Every view is logged, and the patient can see who opened their record.
        </p>
      </div>

      <Link href="/profile" className="mt-4 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold">
          {doctor.initials}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold">{doctor.name}</span>
          <span className="block truncate text-xs text-white/60">{doctor.specialty}</span>
        </span>
      </Link>
    </aside>
  );
}

/** Bottom tab bar shown when the sidebar is hidden. Access log stays in the account menu. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {navItems
          .filter((item) => item.short)
          .map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-semibold ${
                    active ? "text-brand" : "text-body"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-14 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-brand-soft" : ""
                    }`}
                  >
                    <item.icon aria-hidden className="size-5" />
                  </span>
                  {item.short}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
