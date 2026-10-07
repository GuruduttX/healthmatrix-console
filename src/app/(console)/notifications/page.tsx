import type { Metadata } from "next";
import Link from "next/link";

import { markNotificationsRead } from "@/lib/console-actions";
import { getNotifications } from "@/lib/console-data";
import type { Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Notifications" };

const dotTone: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-brand",
  neutral: "bg-muted",
};

export default async function NotificationsPage() {
  const { list: notifications, unread } = await getNotifications();

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Notifications</h1>
      <div className="mt-2 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <p className="text-body">
          {unread > 0 ? `${unread} new.` : "Nothing new."} Bookings, shared records, OTPs you’re waiting
          on and results from the last two weeks. Choose which in{" "}
          <Link href="/profile" className="font-semibold text-brand hover:underline">
            Profile and settings
          </Link>
          .
        </p>
        {unread > 0 ? (
          <form action={markNotificationsRead}>
            <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected">
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-5 max-w-3xl rounded-2xl border border-line bg-card px-5 py-10 text-center text-body shadow-card">
          No notifications yet.
        </p>
      ) : null}

      <ul className="mt-5 max-w-3xl divide-y empty:hidden divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {notifications.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className={`flex gap-4 px-5 py-4 hover:bg-surface ${item.unread ? "bg-brand-soft" : ""}`}>
              <span aria-hidden className={`mt-2 size-2.5 shrink-0 rounded-full ${dotTone[item.tone]}`} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">
                  {item.title}
                  {item.unread ? <span className="sr-only"> (new)</span> : null}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed text-body">{item.body}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-body">{item.time}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
