import type { ReactNode } from "react";
import { BadgeCheck, CalendarCheck, CalendarOff, FlaskConical, FolderOpen, LockKeyhole, RefreshCw, ScrollText, Video } from "lucide-react";

import type { EssentialId } from "../content";
import styles from "./essentials.module.css";

const toasts = [
  { icon: FolderOpen, text: "Ananya shared her record", time: "now" },
  { icon: FlaskConical, text: "A result is back: HbA1c", time: "2m" },
  { icon: Video, text: "Consult with Rohan in 10 minutes", time: "8m" },
  { icon: CalendarCheck, text: "Farah booked Thu, 10:30", time: "21m" },
  { icon: LockKeyhole, text: "Access to Kabir’s record expired", time: "1h" },
];

/** Notifications streaming up, drawn twice end to end for a seamless loop. */
function Notifications() {
  return (
    <div className={styles.ticker}>
      <div className={styles.tickerTrack}>
        {[0, 1].map((copy) =>
          toasts.map(({ icon: Icon, text, time }) => (
            <div key={`${copy}-${text}`} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3.5 py-3 shadow-[0_0_0_1px_rgba(44,72,96,0.06),0_4px_12px_rgba(30,50,70,0.06)]">
              <span className="brand-tile size-8">
                <Icon className="size-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">{text}</p>
              <span className="text-[0.6875rem] font-semibold text-muted">{time}</span>
            </div>
          )),
        )}
      </div>
    </div>
  );
}

function Live() {
  return (
    <div className="grid h-full place-items-center">
      <div className="relative grid size-24 place-items-center">
        <span className={styles.halo} />
        <span className="glass-dish size-16">
          <RefreshCw className={`${styles.turn} size-7 text-brand-deep`} />
        </span>
      </div>
      <p className="glass-pill -mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-success">
        <span className="size-1.5 animate-pulse rounded-full bg-success" /> Updated just now
      </p>
    </div>
  );
}

function Log() {
  const rows = [
    ["Ananya Rao", "Lab tests", "Patient"],
    ["Rohan Mehta", "Full record", "Nominee"],
    ["Farah Khan", "Medicines", "Patient"],
  ];
  return (
    <div className={`${styles.log} relative grid gap-1.5`}>
      <span aria-hidden className={styles.scan} />
      {rows.map(([name, what, by]) => (
        <div key={name} className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold">
          <ScrollText className="size-3.5 shrink-0 text-success" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <span className="text-body">{what}</span>
          <span className="hidden rounded-full bg-success-soft px-2 py-0.5 text-[0.625rem] font-bold text-success sm:inline">OTP · {by}</span>
        </div>
      ))}
    </div>
  );
}

function Bookings() {
  return (
    <div className="grid h-full gap-3 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3 shadow-[0_0_0_1px_rgba(44,72,96,0.06)]">
        <div>
          <p className="text-sm font-bold">Taking new bookings</p>
          <p className={`${styles.swapText} text-xs font-medium text-body`}>
            <span>Patients can book you</span>
            <span>Paused · booked consults stay</span>
          </p>
        </div>
        <span className={styles.toggle} aria-hidden>
          <i />
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/75 px-4 py-3 shadow-[0_0_0_1px_rgba(44,72,96,0.06)]">
        <span className="brand-tile size-9">
          <CalendarOff className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">Time off · Fri, 2–6 pm</p>
          <p className="truncate text-xs font-medium text-body">Note: conference</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:col-span-2">
        {["10–60 min consults", "Up to 30 days ahead", "Per-weekday hours", "Approve requests"].map((chip, index) => (
          <span key={chip} className={`${styles.chip} glass-pill px-3 py-1.5 text-xs font-bold text-ink-mid`} style={{ animationDelay: `${index * 0.6}s` }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function Phone() {
  return (
    <div className="grid h-full place-items-center">
      <div className="relative h-40 w-24 overflow-hidden rounded-[1.4rem] border-4 border-ink bg-[#f7f3ef] shadow-xl">
        <span className="absolute left-1/2 top-1.5 z-10 h-1.5 w-8 -translate-x-1/2 rounded-full bg-ink" />
        <div className={styles.phoneScroll}>
          {[0, 1].map((copy) => (
            <div key={copy} className="grid gap-1.5 px-2 pb-1.5 pt-5">
              <span className="h-2 w-10 rounded-full bg-ink/80" />
              <span className="h-9 rounded-lg bg-linear-to-br from-[#fde3d2] to-[#cfe6ed]" />
              <span className="h-5 rounded-md bg-white" />
              <span className="h-5 rounded-md bg-white" />
              <span className="h-5 rounded-md bg-[#d03f01]/85" />
              <span className="h-5 rounded-md bg-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="relative">
        <span className="grid size-16 place-items-center rounded-full bg-linear-to-br from-[#dbe9f0] to-[#fde3d2] font-display text-xl font-bold text-ink-mid ring-4 ring-white">MI</span>
        <BadgeCheck className="absolute -bottom-1 -right-1 size-6 fill-white text-success" />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {["MBBS, MD", "Diabetology", "English · हिन्दी"].map((chip, index) => (
          <span key={chip} className={`${styles.chipPop} rounded-full bg-white/80 px-2.5 py-1 text-[0.6875rem] font-bold text-ink-mid ring-1 ring-line`} style={{ animationDelay: `${index * 0.25}s` }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tests() {
  return (
    <div className="relative grid h-full place-items-center">
      <span aria-hidden className={styles.bubbles}>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="glass-dish size-20">
        <FlaskConical className={`${styles.tilt} size-9 text-brand-deep`} />
      </span>
    </div>
  );
}

export const visuals: Record<EssentialId, () => ReactNode> = {
  notifications: Notifications,
  live: Live,
  log: Log,
  bookings: Bookings,
  phone: Phone,
  profile: Profile,
  tests: Tests,
};
