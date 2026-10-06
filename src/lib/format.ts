/**
 * Dates and times as doctors read them, always in India time whatever the server's zone.
 * India has no daylight saving, so a fixed +5:30 offset is exact.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ZONE = "Asia/Kolkata";

/** Midnight in India on the day `date` falls on, `days` days later. */
export function istDayStart(date = new Date(), days = 0) {
  const shifted = date.getTime() + IST_OFFSET_MS;
  return new Date(shifted - (shifted % DAY_MS) - IST_OFFSET_MS + days * DAY_MS);
}

const timeFormat = new Intl.DateTimeFormat("en-IN", { timeZone: ZONE, hour: "numeric", minute: "2-digit", hour12: true });
const dateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, day: "2-digit", month: "short", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, day: "numeric", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, weekday: "short", day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, month: "short", year: "numeric" });
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "numeric", hourCycle: "h23" });

/** "10:14 am" */
export const formatTime = (date: Date) => timeFormat.format(date).replace(/\s?([ap])\.?m\.?/i, " $1m").toLowerCase();

/** "12 Sep 2026" */
export const formatDate = (date: Date) => dateFormat.format(date);

/** "Sep 2026", for chart labels. */
export const formatMonth = (date: Date) => monthFormat.format(date);

/** "12 Sep", for chart labels when two readings share a month. */
export const formatShortDate = (date: Date) => shortDateFormat.format(date);

/** "Today", "Tomorrow", "Yesterday" or "Mon 12 Oct". */
export function dayLabel(date: Date, now = new Date()) {
  const diff = Math.round((istDayStart(date).getTime() - istDayStart(now).getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return weekdayFormat.format(date);
}

/** "Today, 10:14 am" or "27 Sep, 4:05 pm". */
export function formatWhen(date: Date, now = new Date()) {
  const day = dayLabel(date, now);
  const prefix = ["Today", "Yesterday", "Tomorrow"].includes(day) ? day : shortDateFormat.format(date);
  return `${prefix}, ${formatTime(date)}`;
}

/** "10:14 am" today, otherwise "27 Sep". */
export function formatShortWhen(date: Date, now = new Date()) {
  const day = dayLabel(date, now);
  if (day === "Today") return formatTime(date);
  return day === "Yesterday" ? day : shortDateFormat.format(date);
}

/** "Good morning" by the hour in India. */
export function greeting(now = new Date()) {
  const hour = Number(hourFormat.format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "in 23 h" or "in 40 min" until `date`. */
export function timeLeft(date: Date, now = new Date()) {
  const minutes = Math.max(1, Math.round((date.getTime() - now.getTime()) / 60000));
  return minutes >= 60 ? `in ${Math.round(minutes / 60)} h` : `in ${minutes} min`;
}
