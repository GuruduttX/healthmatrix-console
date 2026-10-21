import { CalendarDays, CalendarOff, Clock, Radio } from "lucide-react";
import type { Metadata } from "next";

import { ConsultRow } from "@/components/consult-row";
import { RequestsCard } from "@/components/requests/requests-card";
import { AvailabilityCard } from "@/components/schedule/availability-card";
import { TimeOff } from "@/components/schedule/time-off";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle, Chip, EmptyState, PageHeader, Section } from "@/components/ui";
import { getAvailability, getConsultRequests, getDayNotes, getSchedule, getSettings, waitingTitle } from "@/lib/console-data";
import { istDateKey } from "@/lib/schedule";

export async function generateMetadata(): Promise<Metadata> {
  return { title: waitingTitle("Schedule", await getSchedule()) };
}

export default async function SchedulePage() {
  const [consults, settings, availability, notes, requests] = await Promise.all([
    getSchedule(),
    getSettings(),
    getAvailability(),
    getDayNotes(),
    getConsultRequests({ withinWindow: true }),
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
      <PageHeader
        title="Schedule"
        refresh
        description="Your consults, and the hours members can book you in the app."
      />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
          <RequestsCard
            requests={requests}
            emptyText="When a patient asks for a time outside your open slots, it shows up here."
          />
          {days.map((day) => {
            const list = consults.filter((c) => dayOf(c) === day);
            return (
              <Section
                key={day}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {day}
                    {notes[day] ? <Chip tone="warning">{notes[day]}</Chip> : null}
                  </span>
                }
                meta={`${list.length} ${list.length === 1 ? "consult" : "consults"}`}
              >
                <Card flush>
                  {list.length > 0 ? (
                    <ul className="divide-y divide-line">
                      {list.map((consult) => (
                        <ConsultRow key={consult.id} consult={consult} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={CalendarDays} tone="neutral" title="Nothing booked">
                      Consults members book in the next two weeks show up here.
                    </EmptyState>
                  )}
                </Card>
              </Section>
            );
          })}
        </div>

        {/* When members can book: hours, time off, and what's coming. */}
        <Section title="Your hours">
          <div className="flex flex-col gap-5">
            <Card>
              <AvailabilityCard
                title={<CardTitle icon={Clock} tile>Availability</CardTitle>}
                description={`When members can book a ${availability.slotMinutes}-minute video consult with you in the app.`}
                acceptingBookings={availability.acceptingBookings}
                weekly={availability.weekly}
                slotMinutes={availability.slotMinutes}
                bookingWindowDays={availability.bookingWindowDays}
                minNoticeMinutes={availability.minNoticeMinutes}
              />
            </Card>

            <Card>
              <TimeOff
                title={<CardTitle icon={CalendarOff} tile tone="warning">Time off</CardTitle>}
                description="Saved straight away. Members can’t book you then."
                entries={availability.timeOff}
                today={istDateKey()}
                offRestOfToday={availability.offRestOfToday}
              />
            </Card>

            <Card>
              <CardTitle icon={Radio} tile tone="neutral">Other ways to reach you</CardTitle>
              <p className="mt-1 text-[13px] text-body">The app doesn’t offer these yet. Your choice is saved for when it does.</p>
              <SwitchList group="availability" items={comingSoon} />
            </Card>
          </div>
        </Section>
      </div>
    </>
  );
}
