import { z } from "zod";

import {
  INTERVAL_UNITS,
  VACCINE_BRANDS,
  VACCINE_DOSE_UNITS,
  VACCINE_ROUTES,
  VACCINE_SCHEDULES,
  VACCINE_SITES,
  VACCINE_SUGGESTIONS,
} from "@/models/constants";

/**
 * Vaccines on a prescription: the input shape, its checks and the date maths. Shared by the
 * dialog and the server action, and free of server code. Dates are "YYYY-MM-DD" days in India.
 */

export type VaccineRoute = (typeof VACCINE_ROUTES)[number];
export type VaccineDoseUnit = (typeof VACCINE_DOSE_UNITS)[number];
export type VaccineSite = (typeof VACCINE_SITES)[number];
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];

export const ROUTE_LABELS: Record<VaccineRoute, string> = {
  intramuscular: "Intramuscular",
  subcutaneous: "Subcutaneous",
  intradermal: "Intradermal",
  oral: "Oral",
  intranasal: "Intranasal",
};

export const SITE_LABELS: Record<VaccineSite, string> = {
  left_upper_arm: "Left upper arm",
  right_upper_arm: "Right upper arm",
  left_thigh: "Left thigh",
  right_thigh: "Right thigh",
  buttock: "Buttock",
};

export const MAX_DOSES = 10;

/** Today in India as "YYYY-MM-DD". */
export const todayInIndia = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parts(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** `day` moved on by `count` units. Months and years keep the day, clamped: 31 Jan + 1 month is 28/29 Feb. */
export function addInterval(day: string, count: number, unit: IntervalUnit) {
  const { y, m, d } = parts(day);
  if (unit === "days" || unit === "weeks") {
    const date = new Date(Date.UTC(y, m - 1, d + count * (unit === "weeks" ? 7 : 1)));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }
  const months = (m - 1) + count * (unit === "years" ? 12 : 1);
  const year = y + Math.floor(months / 12);
  const month = (months % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(d, daysInMonth(year, month)))}`;
}

/** Every dose date from the first one. Each counts from the first, so clamping never drifts. */
export function buildDoseDates(first: string, count: number, every?: { count: number; unit: IntervalUnit }) {
  if (!DAY_PATTERN.test(first)) return [];
  return Array.from({ length: count }, (_, i) => (i === 0 || !every ? first : addInterval(first, i * every.count, every.unit)));
}

/** "YYYY-MM-DD" in India → the Date at midnight India time. */
export const dayToDate = (day: string) => new Date(`${day}T00:00:00+05:30`);

/** A stored Date → its "YYYY-MM-DD" day in India. */
export const dateToDay = (date: Date) => todayInIndia(date);

const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** "2026-11-06" → "6 Nov 2026" */
export const formatDay = (day: string) => {
  const { y, m, d } = parts(day);
  return dayFormat.format(new Date(Date.UTC(y, m - 1, d)));
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .optional()
    .transform((value) => value || undefined);

/** One vaccine as the dialog sends it. */
export const vaccineInput = z
  .object({
    name: z.string().trim().min(2, "Name the vaccine.").max(80, "Keep the name under 80 characters."),
    brand: optionalText(80),
    doseAmount: z.number({ error: "Enter the dose." }).positive("Enter the dose.").max(100, "That dose looks too large."),
    doseUnit: z.enum(VACCINE_DOSE_UNITS),
    route: z.enum(VACCINE_ROUTES, { error: "Choose how it is given." }),
    site: z.enum(VACCINE_SITES).optional(),
    schedule: z.enum(VACCINE_SCHEDULES),
    everyCount: z.number().int().min(1, "Enter how often.").max(365, "Use 365 or less.").optional(),
    everyUnit: z.enum(INTERVAL_UNITS).optional(),
    /** The number of the first dose on this prescription: 2 if dose 1 was given elsewhere. */
    startDose: z.number().int().min(1, "Start at dose 1 or later.").max(MAX_DOSES, `Start at dose ${MAX_DOSES} or earlier.`),
    dates: z.array(z.string().regex(DAY_PATTERN, "Pick a date for every dose.")).min(1).max(MAX_DOSES),
    instructions: optionalText(300),
  })
  .superRefine((v, ctx) => {
    if (v.schedule === "recurring") {
      if (!v.everyCount || !v.everyUnit) ctx.addIssue({ code: "custom", path: ["everyCount"], message: "Enter how often." });
      if (v.dates.length < 2) ctx.addIssue({ code: "custom", path: ["dates"], message: "A recurring vaccine needs at least 2 doses." });
    } else if (v.dates.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["dates"], message: "A one-time vaccine has one date." });
    }
    if (v.startDose + v.dates.length - 1 > MAX_DOSES) {
      ctx.addIssue({ code: "custom", path: ["startDose"], message: `A series can have at most ${MAX_DOSES} doses.` });
    }
    const today = todayInIndia();
    v.dates.forEach((day, i) => {
      if (i === 0 && day < today) ctx.addIssue({ code: "custom", path: ["dates", 0], message: "The first dose can’t be in the past." });
      if (i > 0 && day <= v.dates[i - 1]) {
        ctx.addIssue({ code: "custom", path: ["dates", i], message: `Dose ${v.startDose + i} must come after dose ${v.startDose + i - 1}.` });
      }
    });
  });

export type VaccineInput = z.input<typeof vaccineInput>;
export type VaccineData = z.output<typeof vaccineInput>;

/** "0.5 mL, intramuscular, left upper arm" */
export function describeDose(v: Pick<VaccineInput, "doseAmount" | "doseUnit" | "route" | "site">) {
  const amount = v.doseUnit === "dose" ? `${v.doseAmount} ${v.doseAmount === 1 ? "dose" : "doses"}` : `${v.doseAmount} ${v.doseUnit}`;
  return [amount, ROUTE_LABELS[v.route].toLowerCase(), v.site ? SITE_LABELS[v.site].toLowerCase() : ""].filter(Boolean).join(", ");
}

/** "One dose" or "3 doses, every 1 month", and "doses 2 to 3 of 3" when the series started earlier. */
export function describeSchedule(v: Pick<VaccineInput, "schedule" | "everyCount" | "everyUnit" | "startDose" | "dates">) {
  const count = v.dates.length;
  if (v.schedule === "one_time") return v.startDose > 1 ? `Dose ${v.startDose}` : "One dose";
  const unit = v.everyCount === 1 ? v.everyUnit?.replace(/s$/, "") : v.everyUnit;
  const every = v.everyCount && unit ? `, every ${v.everyCount} ${unit}` : "";
  const range = v.startDose > 1 ? ` (doses ${v.startDose} to ${v.startDose + count - 1})` : "";
  return `${count} doses${every}${range}`;
}

/** "HPV vaccine, dose 2 of 3" for a reminder or a schedule row. */
export function doseTitle(name: string, number: number, total: number) {
  const label = /vaccine/i.test(name) ? name : `${name} vaccine`;
  return total > 1 ? `${label}, dose ${number} of ${total}` : label;
}

export const vaccineSuggestions = VACCINE_SUGGESTIONS.map((name) => ({ value: name, label: name }));

/** Brands for a vaccine name, matched without regard to case. */
export function brandSuggestions(name: string) {
  const key = VACCINE_SUGGESTIONS.find((v) => v.toLowerCase() === name.trim().toLowerCase());
  return key ? (VACCINE_BRANDS[key] ?? []) : [];
}
