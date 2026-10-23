import { Check, Clock, X } from "lucide-react";

import { useSequence } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Flag, Toggle, tile } from "./parts";

// Paused → hours open → slots booked → a request outside hours → Approve pressed → approved.
const beats = [900, 1500, 1700, 1900, 650, 3200];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const times = ["10:00", "10:30", "17:00", "17:30"];
const booked = new Set(["Mon 10:30", "Tue 17:00", "Wed 10:00", "Thu 17:30", "Fri 10:30"]);

export function ScheduleMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const approved = step === 5;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className={`${tile} flex items-center justify-between gap-3 px-4 py-3`}>
        <div>
          <p className="text-sm font-bold">Taking new bookings</p>
          <p className="text-xs font-medium text-body">{step >= 1 ? "Patients can book your open slots" : "You don’t show up in the app"}</p>
        </div>
        <Toggle on={step >= 1} />
      </div>

      <div className={`${tile} p-3`}>
        <div className="grid grid-cols-5 gap-1.5">
          {days.map((day, column) => (
            <div key={day} className="grid gap-1.5">
              <p className="text-center text-[0.6875rem] font-bold uppercase tracking-wider text-muted">{day}</p>
              {times.map((time, row) => {
                const slot = `${day} ${time}`;
                const isBooked = step >= 2 && booked.has(slot);
                return step >= 1 ? (
                  <span
                    key={slot}
                    className={`${isBooked ? m.fill : m.pop} rounded-lg py-1 text-center text-[0.6875rem] font-bold ${isBooked ? "bg-[#d03f01] text-white" : "bg-white/70 text-body ring-1 ring-line"}`}
                    style={{ animationDelay: isBooked ? `${column * 160}ms` : `${(column + row) * 50}ms` }}
                  >
                    {time}
                  </span>
                ) : (
                  <span key={slot} className="rounded-lg bg-selected py-1.5 text-center text-[0.6875rem] font-bold text-transparent">
                    {time}
                  </span>
                );
              })}
              {day === "Thu" && approved ? (
                <span className={`${m.pop} rounded-lg bg-[#d03f01] py-1.5 text-center text-[0.6875rem] font-bold text-white`}>20:30</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
          <Flag>
            <Clock className="size-3" /> 30 min consults
          </Flag>
          <Flag>Book up to 7 days ahead</Flag>
        </div>
      </div>

      {step >= 3 ? (
        <div className={`${tile} ${m.slide} flex items-center gap-3 px-4 py-3`}>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
              Rohan Mehta · Thu 20:30
              {approved ? (
                <Flag tone="success" className={m.pop}>
                  <Check className="size-3" /> Approved
                </Flag>
              ) : (
                <Flag tone="warning">Request</Flag>
              )}
            </p>
            <p className="truncate text-xs font-medium text-body">{approved ? "Added to your schedule" : "Outside your hours · nothing is booked until you approve"}</p>
          </div>
          {approved ? null : (
            <div className="flex shrink-0 gap-1.5">
              <span className="grid size-8 place-items-center rounded-full bg-selected text-body">
                <X className="size-4" />
              </span>
              <span className={`${step === 4 ? m.press : m.beckon} inline-flex h-8 items-center rounded-full bg-[#d03f01] px-3 text-xs font-bold text-white`}>Approve</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
