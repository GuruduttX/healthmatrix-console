import { Bell, History, LogOut, Search, UserRound } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/lib/auth-actions";
import { notifications } from "@/lib/data";
import type { Doctor } from "@/lib/types";

const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-selected";

export function TopBar({ doctor }: { doctor: Doctor }) {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/95 px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] backdrop-blur lg:py-3 print:hidden sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="HealthMatrix doctor console, home">
        <Image src="/logo-mark.png" alt="" width={28} height={25} />
      </Link>

      <Form action="/patients" role="search" className="relative min-w-0 flex-1 lg:max-w-xl">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-body"
        />
        <input
          type="search"
          name="q"
          aria-label="Search patients"
          placeholder="Search patients"
          className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-body focus:border-brand focus:outline-none"
        />
      </Form>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-selected"
        >
          <Bell aria-hidden className="size-5" />
          {unread > 0 ? (
            <span aria-hidden className="absolute right-2 top-2 size-2.5 rounded-full bg-brand ring-2 ring-card" />
          ) : null}
        </Link>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full py-1 pl-2 pr-1 hover:bg-selected [&::-webkit-details-marker]:hidden">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-sm font-semibold text-ink">{doctor.shortName}</span>
              <span className="block text-xs text-body">{doctor.qualifications}</span>
            </span>
            <span
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-full bg-success text-xs font-bold text-white"
            >
              {doctor.initials}
            </span>
            <span className="sr-only">Account menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-floating">
            <Link href="/profile" className={menuItem}>
              <UserRound aria-hidden className="size-4 text-body" />
              Profile and settings
            </Link>
            <Link href="/access-log" className={menuItem}>
              <History aria-hidden className="size-4 text-body" />
              Access log
            </Link>
            <form action={signOut} className="mt-1 border-t border-line pt-1">
              <button type="submit" className={`${menuItem} text-danger`}>
                <LogOut aria-hidden className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
