"use client";

import { Plus, X } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";

import { switchKnob, switchTrack } from "@/components/switch-list";
import { saveWeeklySchedule } from "@/lib/console-actions";
import { fromMinutes, LIMITS, toMinutes, WEEKDAYS, type Session } from "@/lib/schedule";

import { ClockField } from "./clock-field";
import { SectionHeader } from "./section-header";
import { SaveMessage, useScheduleSave } from "./use-schedule-save";

/** Monday first, as a working week reads. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const INITIALS: Record<number, string> = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

const segmentClass = "segment h-9 lg:h-8";
const inlineLink = "font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink";

type Hours = { from: string; to: string };
/** A weekday's own hours, or undefined while it follows the daily timing. `[]` is a day off. */
type Custom = Partial<Record<number, Hours[]>>;
type Tab = "daily" | number;

/** Numbers stay as typed until saved, so a half-typed "1" isn't snapped to a limit. */
type RuleText = Record<"slotMinutes" | "bookingWindowDays", string>;

const same = (a: Hours[], b: Hours[]) => JSON.stringify(a) === JSON.stringify(b);

const byDay = (weekly: Session[]) =>
  Object.fromEntries(
    WEEK_ORDER.map((weekday) => [
      weekday,
      weekly.filter((s) => s.weekday === weekday).map(({ from, to }) => ({ from, to })),
    ]),
  ) as Record<number, Hours[]>;

/**
 * Splits the saved week into a daily timing and the days that differ from it. The daily
 * timing is the hours most working days share.
 */
function splitWeek(weekly: Session[]) {
  const days = byDay(weekly);
  const counts = new Map<string, number>();
  for (const weekday of WEEK_ORDER) {
    if (days[weekday].length) counts.set(JSON.stringify(days[weekday]), (counts.get(JSON.stringify(days[weekday])) ?? 0) + 1);
  }
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const daily: Hours[] = common ? JSON.parse(common) : [{ from: "09:00", to: "17:00" }];
  const custom: Custom = {};
  for (const weekday of WEEK_ORDER) if (!same(days[weekday], daily)) custom[weekday] = days[weekday];
  return { daily, custom };
}

/** A new block after the last one, or a working morning when there is none. */
function nextHours(hours: Hours[]): Hours {
  const last = hours.at(-1);
  if (!last) return { from: "09:00", to: "13:00" };
  const start = Math.min(toMinutes(last.to) + 60, 23 * 60);
  return { from: fromMinutes(start), to: fromMinutes(Math.min(start + 180, 24 * 60)) };
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={switchTrack(on)}
    >
      <span aria-hidden className={switchKnob(on)} />
    </button>
  );
}

/** The from–to blocks for one day, or for the daily timing. */
function HoursEditor({ hours, onChange, label }: { hours: Hours[]; onChange: (hours: Hours[]) => void; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      {hours.map((block, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5">
          <ClockField
            label={`${label}, block ${i + 1}, from`}
            value={block.from}
            onChange={(from) => onChange(hours.map((h, j) => (j === i ? { ...h, from } : h)))}
          />
          <span aria-hidden className="text-sm text-muted">
            –
          </span>
          <ClockField
            label={`${label}, block ${i + 1}, to`}
            value={block.to}
            allowMidnight
            onChange={(to) => onChange(hours.map((h, j) => (j === i ? { ...h, to } : h)))}
          />
          {hours.length > 1 ? (
            <button
              type="button"
              aria-label={`Remove ${label} block ${i + 1}`}
              onClick={() => onChange(hours.filter((_, j) => j !== i))}
              className="btn btn-ghost btn-sm btn-icon -mr-1.5 text-muted"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
      ))}
      {hours.length < LIMITS.sessionsPerDay ? (
        // A pill of glass with an orange plus, as the app's "Add a time".
        <button
          type="button"
          onClick={() => onChange([...hours, nextHours(hours)])}
          className="btn btn-secondary btn-sm mt-1 w-fit"
        >
          <Plus aria-hidden className="size-4 text-brand-deep" />
          Add more hours, e.g. an evening
        </button>
      ) : null}
    </div>
  );
}

function RuleField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ink">
      {label}
      <span className="field flex items-center gap-2 py-0 focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(221,67,1,0.12)]">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 self-stretch bg-transparent font-medium tabular-nums text-ink outline-none"
        />
        <span className="shrink-0 whitespace-nowrap text-xs font-normal text-muted">{unit}</span>
      </span>
    </label>
  );
}

/**
 * Everything about when members can book, in one place: open or paused, the hours for each
 * day of the week, and the booking rules. One Save sends it all, checked against consults
 * already booked. The chevron by the title hides everything below the weekday tabs.
 */
export function AvailabilityCard({
  title,
  description,
  acceptingBookings,
  weekly,
  slotMinutes,
  bookingWindowDays,
  minNoticeMinutes,
}: {
  title: ReactNode;
  description: ReactNode;
  acceptingBookings: boolean;
  weekly: Session[];
  slotMinutes: number;
  bookingWindowDays: number;
  /** Not shown: kept as saved, a small cut-off so nobody books a slot that starts right away. */
  minNoticeMinutes: number;
}) {
  const savedDays = useMemo(() => byDay(weekly), [weekly]);
  const savedSplit = useMemo(() => splitWeek(weekly), [weekly]);
  const savedRules = useMemo<RuleText>(
    () => ({ slotMinutes: String(slotMinutes), bookingWindowDays: String(bookingWindowDays) }),
    [slotMinutes, bookingWindowDays],
  );

  const [accepting, setAccepting] = useState(acceptingBookings);
  const [daily, setDaily] = useState(savedSplit.daily);
  const [custom, setCustom] = useState(savedSplit.custom);
  const [rules, setRules] = useState(savedRules);
  const [tab, setTab] = useState<Tab>("daily");
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const { run, pending, result, clear, dialog } = useScheduleSave();

  const hoursFor = (weekday: number) => custom[weekday] ?? daily;
  const following = WEEK_ORDER.filter((weekday) => custom[weekday] === undefined);

  const dirty =
    accepting !== acceptingBookings ||
    WEEK_ORDER.some((weekday) => !same(hoursFor(weekday), savedDays[weekday])) ||
    JSON.stringify(rules) !== JSON.stringify(savedRules);

  function setDay(weekday: number, hours: Hours[] | undefined) {
    clear();
    setCustom((current) => ({ ...current, [weekday]: hours }));
  }

  /** Picking a tab while collapsed opens the section, so the tap shows something. */
  function pickTab(next: Tab) {
    setTab(next);
    setOpen(true);
  }

  function undo() {
    clear();
    setAccepting(acceptingBookings);
    setDaily(savedSplit.daily);
    setCustom(savedSplit.custom);
    setRules(savedRules);
  }

  function save() {
    const input = {
      acceptingBookings: accepting,
      slotMinutes: Number(rules.slotMinutes),
      bookingWindowDays: Number(rules.bookingWindowDays),
      minNoticeMinutes,
      weekly: WEEK_ORDER.flatMap((weekday) => hoursFor(weekday).map((hours) => ({ weekday, ...hours }))),
    };
    run((choice) => saveWeeklySchedule(input, choice));
  }

  const weekday = tab === "daily" ? null : tab;
  const dayOn = weekday !== null && hoursFor(weekday).length > 0;

  return (
    <>
      <SectionHeader title={title} open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId} />
      <p className="mt-1 text-[13px] text-body">{description}</p>

      <div className="glass-flat mt-4 flex items-center gap-4 rounded-2xl px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Taking new bookings</p>
          <p className="mt-0.5 text-xs text-body">
            {accepting
              ? "Members can book you in the app during your hours."
              : "Paused. You don’t show up in the app. Consults already booked stay."}
          </p>
        </div>
        <Switch
          on={accepting}
          onToggle={() => {
            clear();
            setAccepting((on) => !on);
          }}
          label="Taking new bookings"
        />
      </div>

      <div role="tablist" aria-label="Timing for" className={`segmented mt-5 ${accepting ? "" : "opacity-60"}`}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "daily"}
          onClick={() => pickTab("daily")}
          className={`${segmentClass} flex-none px-3 sm:px-4`}
        >
          Daily
        </button>
        {WEEK_ORDER.map((day) => {
          const own = custom[day];
          const off = hoursFor(day).length === 0;
          const state = off ? "day off" : own ? "own hours" : "daily timing";
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={tab === day}
              aria-label={`${WEEKDAYS[day]}, ${state}`}
              onClick={() => pickTab(day)}
              className={`${segmentClass} px-0 ${off && tab !== day ? "text-muted line-through" : ""}`}
            >
              <span className="relative">
                {INITIALS[day]}
                {own && !off ? <span aria-hidden className="absolute -right-2 top-0 size-1.5 rounded-full bg-brand" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div id={bodyId} hidden={!open}>
        <div role="tabpanel" className={`glass-flat mt-3 rounded-2xl p-3.5 sm:p-4 ${accepting ? "" : "opacity-60"}`}>
          {weekday === null ? (
            <>
              <p className="mb-3 text-xs text-body">
                {following.length === 7
                  ? "Used every day of the week."
                  : following.length === 0
                    ? "Every day has its own timing now. Tap a day to set it back to this."
                    : `Used on ${following.map((d) => WEEKDAYS[d].slice(0, 3)).join(", ")}. Tap a day to give it different hours or the day off.`}
              </p>
              <HoursEditor
                hours={daily}
                label="Daily timing"
                onChange={(hours) => {
                  clear();
                  setDaily(hours);
                }}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <p className="min-w-0 flex-1 text-sm font-semibold text-ink">
                  {dayOn ? `Working on ${WEEKDAYS[weekday]}` : `${WEEKDAYS[weekday]} off`}
                </p>
                <Switch
                  on={dayOn}
                  label={`Work on ${WEEKDAYS[weekday]}`}
                  onToggle={() => setDay(weekday, dayOn ? [] : daily.length ? undefined : [nextHours([])])}
                />
              </div>
              {dayOn ? (
                <>
                  <HoursEditor
                    hours={hoursFor(weekday)}
                    label={WEEKDAYS[weekday]}
                    onChange={(hours) => setDay(weekday, same(hours, daily) ? undefined : hours)}
                  />
                  <p className="mt-2 text-xs text-body">
                    {custom[weekday] ? (
                      <>
                        Own hours for {WEEKDAYS[weekday]}.{" "}
                        <button type="button" onClick={() => setDay(weekday, undefined)} className={inlineLink}>
                          Use daily timing
                        </button>
                      </>
                    ) : (
                      "Same as your daily timing. Change it here to set this day apart."
                    )}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-body">
                  Members can’t book you on {WEEKDAYS[weekday]}s.{" "}
                  {daily.length ? (
                    <button type="button" onClick={() => setDay(weekday, undefined)} className={inlineLink}>
                      Use daily timing
                    </button>
                  ) : null}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RuleField
            label="Consult length"
            unit="min"
            value={rules.slotMinutes}
            onChange={(slot) => {
              clear();
              setRules((r) => ({ ...r, slotMinutes: slot }));
            }}
            min={LIMITS.slotMinutes.min}
            max={LIMITS.slotMinutes.max}
            step={LIMITS.slotMinutes.step}
          />
          <RuleField
            label="Patients can book up to"
            unit="days ahead"
            value={rules.bookingWindowDays}
            onChange={(window) => {
              clear();
              setRules((r) => ({ ...r, bookingWindowDays: window }));
            }}
            min={LIMITS.bookingWindowDays.min}
            max={LIMITS.bookingWindowDays.max}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Patients book in slots of this length. When you end a consult early, the app offers the time you freed straight away.
        </p>

        <SaveMessage result={result} savedText="Saved. The app now offers these hours." />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={save} disabled={pending || !dirty} className="btn btn-primary">
            {pending ? "Saving…" : "Save changes"}
          </button>
          {dirty ? (
            <>
              <button type="button" onClick={undo} className="btn btn-ghost">
                Undo
              </button>
              <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-bold text-warning"><span aria-hidden className="size-1.5 rounded-full bg-[#c98a00]" />Not saved yet</span>
            </>
          ) : null}
        </div>
      </div>
      {/* Collapsed with the bookings switch changed, the save still has to be reachable. */}
      {!open && dirty ? (
        <p className="mt-3 text-xs font-medium text-warning">
          Not saved yet.{" "}
          <button type="button" onClick={() => setOpen(true)} className={inlineLink}>
            Show and save
          </button>
        </p>
      ) : null}
      {dialog}
    </>
  );
}
