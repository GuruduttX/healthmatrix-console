"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { CheckNewButton } from "@/components/check-new-button";
import { useChrome } from "@/components/chrome";

/** Phones: the bell, with a dot while something is unread, at the right of a hero's title. */
export function HeroButtons({ refresh = false }: { refresh?: boolean }) {
  const { unread } = useChrome();

  return (
    <div className="flex shrink-0 items-center gap-2 lg:hidden">
      {refresh ? <CheckNewButton variant="glass" /> : null}
      <Link
        href="/notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="btn btn-glass btn-icon relative size-11 min-h-11"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 ? (
          <span aria-hidden className="absolute right-[11px] top-[10px] size-2.5 rounded-full border-2 border-ink bg-brand" />
        ) : null}
      </Link>
    </div>
  );
}
