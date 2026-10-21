import { BellRing } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NotificationFeed } from "@/components/notification-feed";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getNotifications } from "@/lib/console-data";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { list: notifications, unread, seenAt, checkedAt } = await getNotifications();

  return (
    <div className="mx-auto max-w-3xl lg:mx-0">
      <PageHeader
        back={{ href: "/", label: "Today" }}
        title="Notifications"
        description={
          <>
            Bookings, shared records, OTPs you’re waiting on and results from the last two weeks. Choose which in{" "}
            <Link href="/profile" className="font-bold text-brand-deep underline-offset-2 hover:underline">
              Profile and settings
            </Link>
            .
          </>
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={BellRing} tone="success" title="You’re all caught up">
            New bookings, shared records and results will show up here.
          </EmptyState>
        </Card>
      ) : (
        <NotificationFeed items={notifications} seenAt={seenAt} checkedAt={checkedAt} unread={unread} />
      )}
    </div>
  );
}
