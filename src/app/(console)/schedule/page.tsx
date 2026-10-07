import { CalendarDays, CalendarOff, Clock, Radio } from "lucide-react";
import type { Metadata } from "next";

import { ConsultRow } from "@/components/consult-row";
import { AvailabilityCard } from "@/components/schedule/availability-card";
import { TimeOff } from "@/components/schedule/time-off";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle, Chip } from "@/components/ui";
import { getAvailability, getDayNotes, getSchedule, getSettings } from "@/lib/console-data";
import { istDateKey } from "@/lib/schedule";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const [consults, settings, availability, notes] = await Promise.all([
    getSchedule(),
    getSettings(),
    getAvailability(),
    getDayNotes(),
  ]);
  // Anything still running from an earlier day is listed under Today.
  const dayOf = (c: (typeof consults)[number]) => (c.status === "in_progress" ? "Today" : c.day);
  const days = [...new Set(["Today", ...consults.map(dayOf)])];
  const { gpNow, podCalls } = settings.availability;
  const comingSoon = [
    {
      id: "gpNow",
      label: "Available for GP consults now",
      hint: "Members who tap Video consult can reach you without an appointment.",
      on: gpNow,
      soon: true,
    },
    {
      id: "podCalls",
      label: "Take calls from pods",
      hint: "A member can call you from inside a pod, right after their tests.",
      on: podCalls,
      soon: true,
    },
  ];

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Schedule</h1>
      <p className="mt-2 max-w-2xl text-body">
        Your consults, and the hours members can book you in the app. A consult opens with the patient’s record
        only after they share an OTP.
      </p>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          {days.map((day) => {
            const list = consults.filter((c) => dayOf(c) === day);
            return (
              <Card key={day} flush>
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
                  <span className="flex flex-wrap items-center gap-2">
                    <CardTitle icon={CalendarDays}>{day}</CardTitle>
                    {notes[day] ? <Chip tone="warning">{notes[day]}</Chip> : null}
                  </span>
                  <span className="text-xs font-semibold text-body">
                    {list.length} {list.length === 1 ? "consult" : "consults"}
                  </span>
                </div>
                {list.length > 0 ? (
                  <ul className="mt-3 divide-y divide-line">
                    {list.map((consult) => (
                      <ConsultRow key={consult.id} consult={consult} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 pb-8 pt-4 text-sm text-body">
                    Nothing booked. Consults members book in the next two weeks show up here.
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Everything about when members can book, in one card. */}
        <Card>
          <CardTitle icon={Clock}>Availability</CardTitle>
          <p className="mt-1 text-sm text-body">
            When members can book a {availability.slotMinutes}-minute video consult with you in the app.
          </p>
          <AvailabilityCard
            acceptingBookings={availability.acceptingBookings}
            weekly={availability.weekly}
            slotMinutes={availability.slotMinutes}
            bookingWindowDays={availability.bookingWindowDays}
            minNoticeMinutes={availability.minNoticeMinutes}
          />

          <section className="mt-6 border-t border-line pt-5">
            <CardTitle icon={CalendarOff}>Time off</CardTitle>
            <p className="mt-1 text-xs text-body">Saved straight away. Members can’t book you then.</p>
            <TimeOff entries={availability.timeOff} today={istDateKey()} />
          </section>

          <section className="mt-6 border-t border-line pt-5">
            <CardTitle icon={Radio}>Other ways to reach you</CardTitle>
            <p className="mt-1 text-xs text-body">The app doesn’t offer these yet. Your choice is saved for when it does.</p>
            <SwitchList group="availability" items={comingSoon} />
          </section>
        </Card>
      </div>
    </>
  );
}
