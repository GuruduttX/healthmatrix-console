import type { Metadata } from "next";
import Link from "next/link";

import { notifications } from "@/lib/data";
import type { Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Notifications" };

const dotTone: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-brand",
  neutral: "bg-muted",
};

export default function NotificationsPage() {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-ink">Notifications</h1>
      <p className="mt-2 text-body">
        {unread > 0 ? `${unread} new since you signed in.` : "Nothing new since you signed in."}
      </p>

      <ul className="mt-5 max-w-3xl divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
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
