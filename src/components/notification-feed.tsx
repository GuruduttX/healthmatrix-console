"use client";

import {
  Bell,
  BellRing,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  ChevronRight,
  FlaskConical,
  KeyRound,
  LockOpen,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, IconTile, Section } from "@/components/ui";
import { markNotificationsSeen } from "@/lib/console-actions";
import type { Notification } from "@/lib/types";

/** An icon for each kind of notice, told apart by where it leads and its tone. */
function iconOf({ href, tone }: Notification): LucideIcon {
  if (href.startsWith("/results")) return FlaskConical;
  if (href.startsWith("/patients/")) return tone === "success" ? LockOpen : tone === "warning" ? KeyRound : TimerOff;
  if (href.startsWith("/consults/")) return tone === "warning" ? BellRing : CalendarPlus;
  if (href.startsWith("/schedule")) return CalendarX;
  if (href === "/") return tone === "brand" ? CalendarClock : CalendarX;
  return Bell;
}

/** A pane of glass with a hairline between notices, each lit on hover; a new one keeps a faint peach. */
function NoticeList({ items, fresh = false }: { items: Notification[]; fresh?: boolean }) {
  return (
    <Card flush>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/60 active:bg-white/60 sm:px-5 ${fresh ? "bg-brand-soft/50" : ""}`}
            >
              <IconTile icon={iconOf(item)} tone={item.tone} size="md" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold leading-snug text-ink">
                    {item.title}
                    {fresh ? <span className="sr-only"> (new)</span> : null}
                  </span>
                  <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs tabular-nums text-muted">{item.time}</span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-body">{item.body}</span>
              </span>
              <ChevronRight aria-hidden className="mt-2.5 size-4.5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * The notices, new ones first. Opening this marks them seen, so the bell's dot goes, and so does
 * any that arrives while it stays open. What was new when the doctor came stays under New until
 * they leave, so nothing jumps while they read; next time it is under Earlier.
 */
export function NotificationFeed({
  items,
  seenAt,
  checkedAt,
  unread,
}: {
  items: Notification[];
  /** When the doctor last had Notifications open, as an ISO string. */
  seenAt: string;
  /** When this list was read, as an ISO string. */
  checkedAt: string;
  /** How many are newer than `seenAt`: the bell's dot. */
  unread: number;
}) {
  // Kept from the first render: the screen reads itself again every 30 seconds, after this visit has marked everything seen.
  const [since] = useState(seenAt);

  useEffect(() => {
    if (unread > 0) markNotificationsSeen(checkedAt).catch(() => {});
  }, [unread, checkedAt]);

  // Both ISO strings in UTC, so they compare as text.
  const fresh = items.filter((item) => item.at > since);
  const earlier = items.filter((item) => item.at <= since);

  return (
    <div className="flex flex-col gap-7">
      {fresh.length ? (
        <Section title="New" count={fresh.length}>
          <NoticeList items={fresh} fresh />
        </Section>
      ) : null}
      {earlier.length ? (
        <Section title={fresh.length ? "Earlier" : "Last two weeks"} meta={`${earlier.length}`}>
          <NoticeList items={earlier} />
        </Section>
      ) : null}
    </div>
  );
}
