/**
 * Mobilab's results for a pod booking, turned into the values a pod screening record keeps.
 *
 * Shared word for word with healthmatrix-app (`src/server/lab-results.ts`): no imports, so the
 * file copies across as it is. Change it here and copy it there, never one side alone, or the
 * app and the console would file the same booking differently.
 */

export type MobilabRange = {
  min?: number | null;
  max?: number | null;
  gender?: string | null;
  age_min?: number | null;
  age_max?: number | null;
};

export type MobilabReading = {
  /** null for values the lab works out from others (HDL, VLDL, ratios). */
  id: number | null;
  test_code: string;
  test_name: string;
  /** pending, accepted, rejected or retest_required; null for worked-out values. */
  status: string | null;
  /** A number when measured. Typed loosely: Mobilab documents a float, but tests read as words
   * (blood group, HIV, dengue) may not send one. */
  value: unknown;
  unit?: string | null;
  method?: string | null;
  /** Objects per sex and age for measured tests; text like "35.0 - 79.5" or "< 130" for worked-out ones. */
  normal_range?: (MobilabRange | string)[] | MobilabRange | string | null;
  profile_name?: string | null;
  package_name?: string | null;
  remarks?: string | null;
  category?: string | null;
};

export type MobilabResults = {
  booking_id: string;
  status: string;
  is_test_mode: boolean;
  tests: MobilabReading[];
  remarks?: string | null;
  disclaimers?: string[];
};

/** One value on a pod screening record: `values[]` on the HealthRecord model. */
export type ScreeningValue = {
  name: string;
  code: string;
  value: number;
  unit?: string;
  referenceRange: { low?: number; high?: number; text?: string };
  /** Only when there is a range to read the value against. */
  flag?: "low" | "high" | "normal";
  method?: string;
  /** The health check it was booked under, e.g. "Liver Function Test"; unset for a single test. */
  group?: string;
};

/** "35.0 - 79.5", "< 130", "> 40" -> min and max; anything else is kept as words. */
export function parseRange(text: string): MobilabRange & { text?: string } {
  const between = /^\s*(-?[\d.]+)\s*[-–]\s*(-?[\d.]+)\s*$/.exec(text);
  if (between) return { min: Number(between[1]), max: Number(between[2]) };
  const below = /^\s*<=?\s*([\d.]+)\s*$/.exec(text);
  if (below) return { max: Number(below[1]) };
  const above = /^\s*>=?\s*([\d.]+)\s*$/.exec(text);
  if (above) return { min: Number(above[1]) };
  return { text: text.trim() };
}

const isNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/**
 * The range that applies to this person: Mobilab lists one per sex, sometimes per age band.
 * Ranges for the other sex are skipped; one with no sex or age applies to everyone.
 */
export function rangeFor(reading: MobilabReading, sex: string, age?: number) {
  const raw = reading.normal_range;
  const ranges: (MobilabRange & { text?: string })[] = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((range) =>
    typeof range === "string" ? parseRange(range) : range,
  );
  const fits = (range: MobilabRange) =>
    (!range.gender || range.gender === sex) &&
    (age === undefined ||
      ((range.age_min == null || age >= range.age_min) && (range.age_max == null || age <= range.age_max)));
  const range = ranges.find(fits) ?? ranges.find((r) => !r.gender || r.gender === sex);
  return {
    low: isNumber(range?.min) ? range.min : undefined,
    high: isNumber(range?.max) ? range.max : undefined,
    text: range?.text,
  };
}

/**
 * The values worth filing: readings the lab accepted, and the values it worked out from them.
 * Pending, rejected and retest readings are left out, and so is anything that isn't a number
 * (the record's value field is numeric, so one would stop the whole booking from filing).
 * A value gets a flag only when it has a numeric range to be read against.
 */
export function screeningValues(results: MobilabResults, sex: string, age?: number): ScreeningValue[] {
  return results.tests.flatMap((reading) => {
    const usable = reading.status === "accepted" || reading.status === null;
    if (!usable || !isNumber(reading.value)) return [];
    const value = reading.value;
    const { low, high, text } = rangeFor(reading, sex, age);
    const flag =
      low !== undefined && value < low
        ? ("low" as const)
        : high !== undefined && value > high
          ? ("high" as const)
          : low !== undefined || high !== undefined
            ? ("normal" as const)
            : undefined;
    return [
      {
        name: reading.test_name.trim(),
        code: reading.test_code,
        value,
        unit: reading.unit?.trim() || undefined,
        referenceRange: { low, high, text },
        flag,
        method: reading.method?.trim() || undefined,
        group: reading.profile_name?.trim() || undefined,
      },
    ];
  });
}

/** "Liver Function Test", "Liver Function Test + 1 more", the one test's name, or "Pod screening". */
export function screeningTitle(profiles: string[], values: { name: string }[]) {
  if (profiles.length) return profiles.length === 1 ? profiles[0] : `${profiles[0]} + ${profiles.length - 1} more`;
  return values.length === 1 ? values[0].name : "Pod screening";
}

/** Booked test codes the record has no value for: not done, turned down, or not a number. */
export function missingTests(booked: string[], filed: { code?: string | null }[]) {
  const have = new Set(filed.map((value) => value.code));
  return booked.filter((code) => !have.has(code));
}
