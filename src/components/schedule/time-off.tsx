"use client";

import { CalendarOff, X } from "lucide-react";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";

import type { TimeOffView } from "@/lib/console-data";
import { addTimeOff, removeTimeOff } from "@/lib/console-actions";
import { ClockField } from "./clock-field";
import { SectionHeader } from "./section-header";
import { SaveMessage, useScheduleSave } from "./use-schedule-save";

const field =
  "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none";

type Kind = "days" | "hours";

const savedText = "Time off saved. Members can’t book you then.";

/**
 * Days off, part of a day off, and the quick "rest of today". The chevron by the title hides
 * everything below the quick button.
 */
export function TimeOff({
  title,
  description,
  entries,
  today,
  offRestOfToday,
}: {
  title: ReactNode;
  description: ReactNode;
  entries: TimeOffView[];
  today: string;
  /** Already away until midnight, so the quick button has nothing left to add. */
  offRestOfToday: boolean;
}) {
  const [kind, setKind] = useState<Kind>("days");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [removing, startRemoving] = useTransition();
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const { run, pending, result, clear, dialog } = useScheduleSave();

  function reset() {
    setFrom(today);
    setTo(today);
    setDate(today);
    setNote("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const input =
      kind === "days"
        ? { kind, from, to: to < from ? from : to, note }
        : { kind, date, from: startTime, to: endTime, note };
    run((choice) => addTimeOff(input, choice), reset);
  }

  return (
    <>
      <SectionHeader title={title} open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId} />
      <p className="mt-1 text-xs text-body">{description}</p>

      <button
        type="button"
        onClick={() => run((choice) => addTimeOff({ kind: "rest_of_today" }, choice))}
        disabled={pending || offRestOfToday}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-bold text-ink hover:bg-selected disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
      >
        <CalendarOff aria-hidden className="size-4 text-brand" />
        {offRestOfToday ? "You’re off for the rest of today" : "I’m off for the rest of today"}
      </button>

      <div id={bodyId} hidden={!open}>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 rounded-xl border border-line p-3.5">
          <div role="radiogroup" aria-label="Time off for" className="flex gap-1 rounded-full bg-surface p-1">
            {(
              [
                ["days", "Whole days"],
                ["hours", "Part of a day"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                onClick={() => {
                  clear();
                  setKind(value);
                }}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold ${kind === value ? "bg-ink text-white" : "text-body hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "days" ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-body">
                From
                <input
                  type="date"
                  required
                  min={today}
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    if (to < e.target.value) setTo(e.target.value);
                  }}
                  className={field}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-body">
                To (included)
                <input type="date" required min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className={field} />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-body">
                Day
                <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </label>
              <div className="col-span-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-body">
                <span className="w-full">Away</span>
                <ClockField label="Away from" value={startTime} onChange={setStartTime} />
                <span aria-hidden className="text-sm">–</span>
                <ClockField label="Away until" value={endTime} onChange={setEndTime} allowMidnight />
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1 text-xs font-semibold text-body">
            Note for yourself (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder="e.g. Conference"
              className={field}
            />
          </label>
          <p className="text-xs text-body">Patients don’t see this note.</p>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add time off"}
          </button>
        </form>

        {open ? <SaveMessage result={result} savedText={savedText} /> : null}

        {entries.length > 0 ? (
          <ul className="mt-4 divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-ink">
                    {entry.label}
                    {entry.now ? (
                      <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning">Now</span>
                    ) : null}
                  </p>
                  {entry.note ? <p className="text-body">{entry.note}</p> : null}
                </div>
                <button
                  type="button"
                  aria-label={`Remove time off: ${entry.label}`}
                  disabled={removing}
                  onClick={() => startRemoving(() => removeTimeOff(entry.id))}
                  className="rounded-full p-1.5 text-body hover:bg-selected disabled:opacity-60"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-body">No time off coming up.</p>
        )}
      </div>
      {/* Collapsed, the quick button's result still shows under it. */}
      {open ? null : <SaveMessage result={result} savedText={savedText} />}
      {dialog}
    </>
  );
}
