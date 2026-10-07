import { Bell, History, LogOut, Search, UserRound, UserRoundPen } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";

import { CheckNewButton } from "@/components/check-new-button";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { SignOutForm } from "@/components/sign-out-form";
import type { Doctor } from "@/lib/types";

const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-selected";

export function TopBar({ doctor, unread }: { doctor: Doctor; unread: number }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/95 px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] backdrop-blur lg:py-3 print:hidden sm:px-6 lg:px-8">
      {/* Hidden on the narrowest phones to leave room for search; Today is in the bottom tabs. */}
      <Link href="/" className="hidden items-center gap-2 min-[360px]:flex lg:hidden" aria-label="HealthMatrix doctor console, home">
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

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* On wide screens this lives in the sidebar. */}
        <span className="contents lg:hidden">
          <CheckNewButton variant="icon" />
        </span>
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
            <span className="relative">
              <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} />
              {doctor.missing.length ? (
                <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-card lg:hidden" />
              ) : null}
            </span>
            <span className="sr-only">Account menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-floating">
            <Link href="/profile" className={menuItem}>
              <UserRound aria-hidden className="size-4 text-body" />
              Profile and settings
            </Link>
            <Link href="/profile/edit" className={menuItem}>
              <UserRoundPen aria-hidden className="size-4 text-body" />
              Edit profile
              {doctor.missing.length ? (
                <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                  {doctor.missing.length} to add
                </span>
              ) : null}
            </Link>
            <Link href="/access-log" className={menuItem}>
              <History aria-hidden className="size-4 text-body" />
              Access log
            </Link>
            <SignOutForm className="mt-1 border-t border-line pt-1">
              <button type="submit" className={`${menuItem} text-danger`}>
                <LogOut aria-hidden className="size-4" />
                Sign out
              </button>
            </SignOutForm>
          </div>
        </details>
      </div>
    </header>
  );
}
