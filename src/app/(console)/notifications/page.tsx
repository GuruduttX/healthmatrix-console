import {
  Bell,
  BellRing,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  CheckCheck,
  ChevronRight,
  FlaskConical,
  KeyRound,
  LockOpen,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { Card, EmptyState, IconTile, PageHeader, Section } from "@/components/ui";
import { markNotificationsRead } from "@/lib/console-actions";
import { getNotifications } from "@/lib/console-data";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Notifications" };

/** An icon for each kind of notice, told apart by where it leads and its tone. */
function iconOf({ href, tone }: Notification): LucideIcon {
  if (href.startsWith("/results")) return FlaskConical;
  if (href.startsWith("/patients/")) return tone === "success" ? LockOpen : tone === "warning" ? KeyRound : TimerOff;
  if (href.startsWith("/consults/")) return tone === "warning" ? BellRing : CalendarPlus;
  if (href.startsWith("/schedule")) return CalendarX;
  if (href === "/") return tone === "brand" ? CalendarClock : CalendarX;
  return Bell;
}

function NoticeList({ items }: { items: Notification[] }) {
  return (
    <Card flush>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface active:bg-surface sm:px-5 ${item.unread ? "bg-brand-soft/50" : ""}`}
            >
              <IconTile icon={iconOf(item)} tone={item.tone} size="md" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold leading-snug text-ink">
                    {item.title}
                    {item.unread ? <span className="sr-only"> (new)</span> : null}
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

export default async function NotificationsPage() {
  const { list: notifications, unread } = await getNotifications();
  const fresh = notifications.filter((item) => item.unread);
  const earlier = notifications.filter((item) => !item.unread);

  return (
    <div className="mx-auto max-w-3xl lg:mx-0">
      <PageHeader
        back={{ href: "/", label: "Today" }}
        title="Notifications"
        description={
          <>
            Bookings, shared records, OTPs you’re waiting on and results from the last two weeks. Choose which in{" "}
            <Link href="/profile" className="font-bold text-brand hover:text-brand-strong">
              Profile and settings
            </Link>
            .
          </>
        }
        actions={
          unread > 0 ? (
            <form action={markNotificationsRead}>
              <SubmitButton pendingText="Marking…" className="btn btn-secondary w-full sm:w-auto">
                <CheckCheck aria-hidden className="size-4 text-brand" />
                Mark all as read
              </SubmitButton>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={BellRing} tone="success" title="You’re all caught up">
            New bookings, shared records and results will show up here.
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-7">
          {fresh.length ? (
            <Section title="New" count={fresh.length}>
              <NoticeList items={fresh} />
            </Section>
          ) : null}
          {earlier.length ? (
            <Section title={fresh.length ? "Earlier" : "Last two weeks"} meta={`${earlier.length}`}>
              <NoticeList items={earlier} />
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}
