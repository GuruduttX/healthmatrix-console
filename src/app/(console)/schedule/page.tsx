import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";

import { ConsultRow } from "@/components/consult-row";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle } from "@/components/ui";
import { consults } from "@/lib/data";

export const metadata: Metadata = { title: "Schedule" };

const availability = [
  {
    id: "gp-now",
    label: "Available for GP consults now",
    hint: "Members who tap Video consult can reach you without an appointment.",
    on: true,
  },
  {
    id: "pod-calls",
    label: "Take calls from pods",
    hint: "A member can call you from inside a pod, right after their tests.",
    on: true,
  },
  {
    id: "appointments",
    label: "Open for specialist appointments",
    hint: "Diabetes and endocrinology slots, weekdays 4 pm to 7 pm.",
    on: false,
  },
];

export default function SchedulePage() {
  const days = [...new Set(consults.map((c) => c.day ?? "Today"))];

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
            const list = consults.filter((c) => (c.day ?? "Today") === day);
            return (
              <Card key={day} flush>
                <div className="flex items-baseline justify-between px-5 pt-5">
                  <CardTitle icon={CalendarDays}>{day}</CardTitle>
                  <span className="text-xs font-semibold text-body">
                    {list.length} {list.length === 1 ? "consult" : "consults"}
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-line">
                  {list.map((consult) => (
                    <ConsultRow key={consult.id} consult={consult} />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card>
          <h2 className="text-sm font-bold text-ink">Availability</h2>
          <SwitchList items={availability} />
        </Card>
      </div>
    </>
  );
}
