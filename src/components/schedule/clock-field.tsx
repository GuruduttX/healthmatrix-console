"use client";

import { Clock } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { clockLabel, fromMinutes, toMinutes } from "@/lib/schedule";

/**
 * A time field: type a time ("9:30 pm", "21:30", "noon"), or pick it on a clock face that
 * opens below. The dial sets the hour first, then the minutes in 5-minute steps. Values are
 * "HH:mm" in 24-hour time; "24:00" (midnight, end of day) only where `allowMidnight` is set.
 */

const SIZE = 224;
const CENTER = SIZE / 2;
const RADIUS = 84;
/** Twelve marks either way: hours 1–12, or minutes 00–55. */
const MARKS = 12;

type Mode = "hour" | "minute";

/** "9:30 pm", "930p", "21:30", "9", "noon", "midnight" -> "HH:mm", or null. */
export function parseTime(text: string, allowMidnight = false): string | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (t === "noon") return "12:00";
  if (t === "midnight") return allowMidnight ? "24:00" : "00:00";
  const match = /^(\d{1,2})(?:[:.\s]?(\d{2}))?\s*(am|pm|a|p)?\.?m?\.?$/.exec(t);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const half = match[3]?.[0];
  if (minutes > 59) return null;
  if (half) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (half === "p" ? 12 : 0);
  } else if (hours === 24 && minutes === 0 && allowMidnight) {
    return "24:00";
  } else if (hours > 23) {
    return null;
  }
  return fromMinutes(hours * 60 + minutes);
}

/** Splits "HH:mm" into the clock's parts. Midnight at end of day reads as 12:00 am. */
function parts(value: string) {
  const total = toMinutes(value) % (24 * 60);
  const h24 = Math.floor(total / 60);
  return { hour: h24 % 12 || 12, minute: total % 60, pm: h24 >= 12 };
}

const join = (hour: number, minute: number, pm: boolean) => fromMinutes(((hour % 12) + (pm ? 12 : 0)) * 60 + minute);

/** Where a dial position sits, for `index` of `count` marks starting at 12 o'clock. */
function point(index: number, count: number, radius = RADIUS) {
  const angle = (index / count) * 2 * Math.PI;
  return { x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) };
}

export function ClockField({
  value,
  onChange,
  label,
  allowMidnight = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  allowMidnight?: boolean;
}) {
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [mode, setMode] = useState<Mode>("hour");
  const [draft, setDraft] = useState<string | null>(null);
  const dragging = useRef(false);

  const { hour, minute, pm } = parts(value);
  const midnight = value === "24:00";

  // Close when focus or a tap goes elsewhere.
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  function show() {
    if (open) return;
    const rect = wrapper.current?.getBoundingClientRect();
    setAlignRight(Boolean(rect && rect.left + 288 > window.innerWidth - 16));
    setMode("hour");
    setOpen(true);
  }

  function commitDraft() {
    if (draft === null) return;
    const parsed = parseTime(draft, allowMidnight);
    if (parsed) onChange(parsed);
    setDraft(null);
  }

  function pick(event: PointerEvent<SVGSVGElement>, finish: boolean) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * SIZE - CENTER;
    const y = ((event.clientY - rect.top) / rect.height) * SIZE - CENTER;
    const turn = (Math.atan2(x, -y) + 2 * Math.PI) % (2 * Math.PI);
    if (mode === "hour") {
      const next = Math.round(turn / ((2 * Math.PI) / 12)) % 12 || 12;
      onChange(join(next, minute, pm));
      if (finish) setMode("minute");
    } else {
      const next = (Math.round(turn / ((2 * Math.PI) / 12)) % 12) * 5;
      onChange(join(hour, next, pm));
    }
  }

  function step(event: KeyboardEvent<SVGSVGElement>) {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (event.key === "Enter") {
      event.preventDefault();
      if (mode === "hour") setMode("minute");
      else setOpen(false);
      return;
    }
    if (!delta) return;
    event.preventDefault();
    if (mode === "hour") onChange(join(((hour - 1 + delta + 12) % 12) + 1, minute, pm));
    else onChange(join(hour, (minute + delta * 5 + 60) % 60, pm));
  }

  const selected = mode === "hour" ? hour % 12 : minute / 5;
  const hand = point(selected, MARKS);
  // Minutes off the 5-minute grid (typed in) have no mark; the hand still points at them.
  const onGrid = mode === "hour" || minute % 5 === 0;
  const exactHand = mode === "minute" && !onGrid ? point(minute, 60) : hand;

  const part = "rounded-lg px-2 py-1 font-display text-3xl font-bold tabular-nums";

  return (
    <div ref={wrapper} className="relative">
      <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-brand">
        <input
          id={id}
          aria-label={label}
          value={draft ?? clockLabel(value)}
          onFocus={(e) => {
            e.target.select();
            show();
          }}
          onClick={show}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
              setOpen(false);
            }
            if (e.key === "Escape") {
              setDraft(null);
              setOpen(false);
            }
          }}
          inputMode="text"
          autoComplete="off"
          className="w-[5.25rem] min-w-0 bg-transparent py-1.5 pl-2.5 text-sm font-semibold text-ink focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => (open ? setOpen(false) : show())}
          className="px-2 text-body hover:text-brand"
        >
          <Clock className="size-4" />
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label={`${label}: pick a time`}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              wrapper.current?.querySelector("input")?.focus();
            }
          }}
          className={`absolute top-full z-40 mt-2 w-72 rounded-2xl border border-line bg-card p-4 shadow-floating ${alignRight ? "right-0" : "left-0"}`}
        >
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setMode("hour")}
              aria-pressed={mode === "hour"}
              className={`${part} ${mode === "hour" ? "bg-brand-soft text-brand" : "text-ink hover:bg-selected"}`}
            >
              {midnight ? "12" : String(hour).padStart(2, "0")}
            </button>
            <span className="font-display text-3xl font-bold text-body">:</span>
            <button
              type="button"
              onClick={() => setMode("minute")}
              aria-pressed={mode === "minute"}
              className={`${part} ${mode === "minute" ? "bg-brand-soft text-brand" : "text-ink hover:bg-selected"}`}
            >
              {String(minute).padStart(2, "0")}
            </button>
            <div className="ml-2 flex flex-col gap-1">
              {(["am", "pm"] as const).map((half) => {
                const active = (half === "pm") === pm && !midnight;
                return (
                  <button
                    key={half}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(join(hour, minute, half === "pm"))}
                    className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${active ? "bg-ink text-white" : "text-body hover:bg-selected"}`}
                  >
                    {half}
                  </button>
                );
              })}
            </div>
          </div>

          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="slider"
            tabIndex={0}
            aria-label={mode === "hour" ? "Hour" : "Minutes"}
            aria-valuemin={mode === "hour" ? 1 : 0}
            aria-valuemax={mode === "hour" ? 12 : 55}
            aria-valuenow={mode === "hour" ? hour : minute}
            aria-valuetext={clockLabel(value)}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              pick(e, false);
            }}
            onPointerMove={(e) => {
              if (dragging.current) pick(e, false);
            }}
            onPointerUp={(e) => {
              if (!dragging.current) return;
              dragging.current = false;
              pick(e, true);
            }}
            onKeyDown={step}
            className="mx-auto mt-3 block w-56 cursor-pointer touch-none select-none rounded-full focus-visible:outline-offset-4"
          >
            <circle cx={CENTER} cy={CENTER} r={CENTER - 4} className="fill-surface" />
            <line
              x1={CENTER}
              y1={CENTER}
              x2={exactHand.x}
              y2={exactHand.y}
              strokeWidth={2}
              className="stroke-brand"
            />
            <circle cx={CENTER} cy={CENTER} r={4} className="fill-brand" />
            <circle cx={exactHand.x} cy={exactHand.y} r={18} className="fill-brand" />
            {Array.from({ length: MARKS }, (_, i) => {
              const { x, y } = point(i, MARKS);
              const text = mode === "hour" ? String(i || 12) : String(i * 5).padStart(2, "0");
              const isSelected = onGrid && i === selected;
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`pointer-events-none text-[13px] font-semibold ${isSelected ? "fill-white" : "fill-ink"}`}
                >
                  {text}
                </text>
              );
            })}
          </svg>

          <div className="mt-3 flex items-center justify-between gap-2">
            {allowMidnight ? (
              <button
                type="button"
                onClick={() => {
                  onChange("24:00");
                  setOpen(false);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${midnight ? "bg-ink text-white" : "border border-line text-ink hover:bg-selected"}`}
              >
                Until midnight
              </button>
            ) : (
              <span className="text-xs text-body">{mode === "hour" ? "Pick the hour" : "Pick the minutes"}</span>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-danger"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
