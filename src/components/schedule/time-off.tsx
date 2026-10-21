"use client";

import { CalendarOff, X } from "lucide-react";
import { useId, useState, useTransition, type FormEvent, type ReactNode } from "react";

import { Chip } from "@/components/ui";
import type { TimeOffView } from "@/lib/console-data";
import { addTimeOff, removeTimeOff } from "@/lib/console-actions";
import { ClockField } from "./clock-field";
import { SectionHeader } from "./section-header";
import { SaveMessage, useScheduleSave } from "./use-schedule-save";

const labelClass = "flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ink";

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
      <p className="mt-1 text-[13px] text-body">{description}</p>

      <button
        type="button"
        onClick={() => run((choice) => addTimeOff({ kind: "rest_of_today" }, choice))}
        disabled={pending || offRestOfToday}
        className="btn btn-secondary mt-3 w-full"
      >
        <CalendarOff aria-hidden className="size-4 text-muted" />
        {offRestOfToday ? "You’re off for the rest of today" : "I’m off for the rest of today"}
      </button>

      <div id={bodyId} hidden={!open}>
        <form onSubmit={submit} className="glass-flat mt-3 flex flex-col gap-3.5 rounded-2xl p-3.5 sm:p-4">
          <div role="radiogroup" aria-label="Time off for" className="segmented">
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
                className="segment"
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "days" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
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
                  className="field"
                />
              </label>
              <label className={labelClass}>
                To (included)
                <input type="date" required min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className="field" />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className={`col-span-2 ${labelClass}`}>
                Day
                <input type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} className="field" />
              </label>
              <div className="col-span-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
                <span className="-mb-0.5 w-full">Away</span>
                <ClockField label="Away from" value={startTime} onChange={setStartTime} />
                <span aria-hidden className="text-sm font-normal text-muted">
                  –
                </span>
                <ClockField label="Away until" value={endTime} onChange={setEndTime} allowMidnight />
              </div>
            </div>
          )}

          <label className={labelClass}>
            Note for yourself (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder="e.g. Conference"
              className="field"
            />
          </label>
          <p className="-mt-2 text-xs text-muted">Patients don’t see this note.</p>

          <button type="submit" disabled={pending} className="btn btn-primary sm:self-start">
            {pending ? "Saving…" : "Add time off"}
          </button>
        </form>

        {open ? <SaveMessage result={result} savedText={savedText} /> : null}

        {entries.length > 0 ? (
          <ul className="glass-flat mt-4 divide-y divide-line overflow-hidden rounded-2xl">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 pl-3.5 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold tabular-nums text-ink">
                    {entry.label}
                    {entry.now ? <Chip tone="warning">Now</Chip> : null}
                  </p>
                  {entry.note ? <p className="mt-0.5 text-[13px] text-body">{entry.note}</p> : null}
                </div>
                <button
                  type="button"
                  aria-label={`Remove time off: ${entry.label}`}
                  disabled={removing}
                  onClick={() => startRemoving(() => removeTimeOff(entry.id))}
                  className="btn btn-ghost btn-sm btn-icon text-muted"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] text-muted">No time off coming up.</p>
        )}
      </div>
      {/* Collapsed, the quick button's result still shows under it. */}
      {open ? null : <SaveMessage result={result} savedText={savedText} />}
      {dialog}
    </>
  );
}
