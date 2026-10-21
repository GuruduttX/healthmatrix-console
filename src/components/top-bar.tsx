import { Bell, ChevronDown, History, LogOut, UserRound, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DoctorAvatar } from "@/components/doctor-avatar";
import { PatientSearch, PatientSearchFallback } from "@/components/patient-search";
import { SignOutForm } from "@/components/sign-out-form";
import type { Doctor } from "@/lib/types";

const menuItem =
  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface";

/**
 * Wide screens: search, notifications and the account menu along the top. Phones put these in
 * each screen's own header and the tab bar instead.
 */
export function TopBar({ doctor, unread }: { doctor: Doctor; unread: number }) {
  return (
    <header className="sticky top-0 z-20 hidden h-16 items-center gap-3 bg-canvas/10 px-8 backdrop-blur-[8px] lg:flex print:hidden">
      <Suspense fallback={<PatientSearchFallback />}>
        <PatientSearch />
      </Suspense>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="btn btn-frost btn-icon relative size-10"
        >
          <Bell aria-hidden className="size-4.5" />
          {unread > 0 ? (
            <span aria-hidden className="absolute right-2.5 top-2.5 size-2 rounded-full bg-brand ring-2 ring-white" />
          ) : null}
        </Link>

        <details className="relative">
          <summary className="glass-small flex cursor-pointer list-none items-center gap-1.5 rounded-full p-1 pr-2.5 transition-colors hover:bg-white/70 [&::-webkit-details-marker]:hidden">
            <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} />
            <ChevronDown aria-hidden className="size-3.5 text-muted" />
            <span className="sr-only">Account menu</span>
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-card p-2 shadow-floating">
            <div className="mb-1 flex items-center gap-3 border-b border-line px-2.5 pb-3 pt-2">
              <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{doctor.name}</p>
                <p className="truncate text-xs text-body">{[doctor.qualifications, doctor.specialty].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <Link href="/profile" className={menuItem}>
              <UserRound aria-hidden className="size-4 text-muted" />
              Profile and settings
            </Link>
            <Link href="/profile/edit" className={menuItem}>
              <UserRoundPen aria-hidden className="size-4 text-muted" />
              Edit profile
              {doctor.missing.length ? (
                <span className="ml-auto rounded-full bg-brand-soft px-2 text-[11px] font-bold leading-5 text-brand-deep">
                  {doctor.missing.length} to add
                </span>
              ) : null}
            </Link>
            <Link href="/access-log" className={menuItem}>
              <History aria-hidden className="size-4 text-muted" />
              Access log
            </Link>
            <SignOutForm className="mt-1 border-t border-line pt-1">
              <button type="submit" className={`${menuItem} text-danger hover:bg-danger-soft`}>
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
