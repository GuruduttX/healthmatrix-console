"use client";

import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { isFocusScreen } from "@/components/mobile-chrome";
import { gapSummary, profilePercent } from "@/lib/profile-gaps";
import type { ProfileGap } from "@/lib/types";

const KEY = "hm-profile-nudge-dismissed";
const listeners = new Set<() => void>();
let hiddenWithoutStorage = false;

/** Dismissed for this browser session only; it comes back next time until the profile is done. */
function isDismissed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked: hidden until the next page load instead.
  }
  hiddenWithoutStorage = true;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** A ring showing how complete the profile is. */
function Ring({ percent }: { percent: number }) {
  const radius = 18;
  const length = 2 * Math.PI * radius;
  return (
    <span className="relative inline-flex size-12 shrink-0 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-brand-light/50" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - percent / 100)}
          className="stroke-brand"
        />
      </svg>
      <span className="text-xs font-bold text-ink">{percent}%</span>
    </span>
  );
}

/** Phones only: asks the doctor to finish the parts of their profile onboarding skipped. */
export function ProfileNudge({ missing }: { missing: ProfileGap[] }) {
  const pathname = usePathname();
  // Hidden on the server and on first paint, so a dismissed nudge never flashes back in.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => hiddenWithoutStorage || isDismissed(),
    () => true,
  );
  if (missing.length === 0 || dismissed || isFocusScreen(pathname)) return null;

  const percent = profilePercent(missing);
  return (
    <aside
      aria-label="Complete your profile"
      className="nudge-enter relative mb-5 flex items-center gap-3 rounded-2xl border border-brand-light bg-brand-soft p-3 pr-2 lg:hidden print:hidden"
    >
      <Link href="/profile/edit" className="flex min-w-0 flex-1 items-center gap-3">
        <Ring percent={percent} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">Complete your profile</span>
          <span className="block truncate text-xs text-body">Add {gapSummary(missing).toLowerCase()}</span>
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-brand" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide for now"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-body hover:bg-white/60"
      >
        <X aria-hidden className="size-4" />
      </button>
    </aside>
  );
}
