"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { CheckNewButton } from "@/components/check-new-button";
import { useChrome } from "@/components/chrome";

/**
 * Phones: the bell, with a dot while something is unread, at the right of a screen's title: a
 * round of glass, as the app's header buttons. `refresh` adds "check for updates" beside it.
 */
export function HeroButtons({ refresh = false }: { refresh?: boolean }) {
  const { unread } = useChrome();

  return (
    <div className="flex shrink-0 items-center gap-2 lg:hidden">
      {refresh ? <CheckNewButton variant="frost" /> : null}
      <Link
        href="/notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="btn btn-icon btn-frost relative size-11 min-h-11"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute right-[11px] top-[10px] size-2.5 rounded-full border-2 border-white bg-brand"
          />
        ) : null}
      </Link>
    </div>
  );
}
