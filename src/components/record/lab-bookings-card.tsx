import { ChevronRight, FileText, TestTubes } from "lucide-react";
import Link from "next/link";

import { Card, Chip, PanelHeader } from "@/components/ui";
import type { LabBooking } from "@/lib/types";

/**
 * Tests the patient booked at a pod from the app, newest first: where each one is at the lab and,
 * once the report is out, links to its values and the lab's PDF. Statuses come fresh from Mobilab
 * when the record opens (`syncMemberBookings`).
 */
export function LabBookingsCard({
  patientId,
  bookings,
  connected,
  className = "",
}: {
  patientId: string;
  bookings: LabBooking[];
  /** False when Mobilab isn't set up here, so the statuses can't be refreshed. */
  connected: boolean;
  className?: string;
}) {
  return (
    <Card flush id="lab" className={className}>
      <PanelHeader
        icon={TestTubes}
        tone="brand"
        title="Lab tests"
        count={bookings.length}
        description={connected ? undefined : "The lab isn’t connected here, so these are the last statuses on file."}
      />
      <ul className="divide-y divide-line">
        {bookings.map((booking) => {
          const record = booking.recordId ? `/patients/${patientId}/records/${booking.recordId}` : undefined;
          return (
            <li key={booking.id} className="px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{booking.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{booking.subtitle}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Chip tone={booking.stage.tone}>{booking.stage.label}</Chip>
                  {booking.isSample ? <Chip tone="warning">Sample values</Chip> : null}
                </div>
              </div>

              {booking.note ? <p className="mt-2 text-[13px] text-body">{booking.note}</p> : null}

              {record ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Link href={record} className="btn btn-soft btn-sm">
                    See results
                    <ChevronRight aria-hidden className="size-4" />
                  </Link>
                  <a href={`${record}/report`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                    <FileText aria-hidden className="size-4" />
                    PDF report
                  </a>
                </div>
              ) : null}

              <p className="mt-2 text-[11px] tabular-nums text-muted">Booking {booking.reference}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
