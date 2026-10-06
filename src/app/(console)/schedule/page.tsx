import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

import { ConsultRow } from "@/components/consult-row";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle } from "@/components/ui";
import { getSchedule, getSettings } from "@/lib/console-data";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const [consults, settings] = await Promise.all([getSchedule(), getSettings()]);
  // Anything still running from an earlier day is listed under Today.
  const dayOf = (c: (typeof consults)[number]) => (c.status === "in_progress" ? "Today" : c.day);
  const days = [...new Set(["Today", ...consults.map(dayOf)])];
  const { gpNow, podCalls, appointments } = settings.availability;
  const availability = [
    {
      id: "gpNow",
      label: "Available for GP consults now",
      hint: "Members who tap Video consult can reach you without an appointment.",
      on: gpNow,
    },
    {
      id: "podCalls",
      label: "Take calls from pods",
      hint: "A member can call you from inside a pod, right after their tests.",
      on: podCalls,
    },
    {
      id: "appointments",
      label: "Open for specialist appointments",
      hint: "Members can book a slot with you for your specialties.",
      on: appointments,
    },
  ];

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Schedule</h1>
      <p className="mt-2 max-w-2xl text-body">
        Your consults, and when members can reach you. A consult opens with the patient’s record
        only after they share an OTP.
      </p>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {days.map((day) => {
            const list = consults.filter((c) => dayOf(c) === day);
            return (
              <Card key={day} flush>
                <div className="flex items-baseline justify-between px-5 pt-5">
                  <CardTitle icon={CalendarDays}>{day}</CardTitle>
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

        <Card>
          <h2 className="text-sm font-bold text-ink">Availability</h2>
          <SwitchList group="availability" items={availability} />
        </Card>
      </div>
    </>
  );
}
