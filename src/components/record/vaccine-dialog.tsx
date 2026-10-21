"use client";

import { History, Syringe } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { DialogFooter, DialogHeader } from "@/components/dialog-parts";
import {
  ROUTE_LABELS,
  SITE_LABELS,
  MAX_DOSES,
  brandSuggestions,
  buildDoseDates,
  todayInIndia,
  vaccineInput,
  vaccineSuggestions,
  type IntervalUnit,
  type VaccineDoseUnit,
  type VaccineInput,
  type VaccineRoute,
  type VaccineSite,
} from "@/lib/vaccines";
import { INTERVAL_UNITS, VACCINE_DOSE_UNITS, VACCINE_ROUTES, VACCINE_SITES } from "@/models/constants";

type Errors = Partial<Record<string, string>>;

const field = "field aria-invalid:border-danger";

/** Fields kept as text while typing, turned into numbers on save. */
type Draft = {
  name: string;
  brand: string;
  doseAmount: string;
  doseUnit: VaccineDoseUnit;
  route: VaccineRoute | "";
  site: VaccineSite | "";
  schedule: "one_time" | "recurring";
  everyCount: string;
  everyUnit: IntervalUnit;
  doseCount: string;
  startDose: string;
  dates: string[];
  instructions: string;
};

function toDraft(v?: VaccineInput): Draft {
  const today = todayInIndia();
  return {
    name: v?.name ?? "",
    brand: v?.brand ?? "",
    doseAmount: v ? String(v.doseAmount) : "0.5",
    doseUnit: v?.doseUnit ?? "mL",
    route: v?.route ?? "",
    site: v?.site ?? "",
    schedule: v?.schedule ?? "one_time",
    everyCount: String(v?.everyCount ?? 1),
    everyUnit: v?.everyUnit ?? "months",
    doseCount: String(v && v.schedule === "recurring" ? v.dates.length : 3),
    startDose: String(v?.startDose ?? 1),
    dates: v?.dates ?? [today],
    instructions: v?.instructions ?? "",
  };
}

const blankDraft = () => JSON.stringify(toDraft());

/**
 * A form kept from earlier (see `rx-autosave.ts`), if it still has the shape of a `Draft`.
 * Anything missing or odd is dropped rather than trusted.
 */
function fromStored(value: unknown): Draft | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const text = (key: keyof Draft) => (typeof v[key] === "string" ? (v[key] as string) : undefined);
  const oneOf = <T extends string>(key: keyof Draft, allowed: readonly T[]) =>
    allowed.includes(v[key] as T) ? (v[key] as T) : undefined;
  const dates = Array.isArray(v.dates) && v.dates.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
    ? (v.dates as string[]).slice(0, MAX_DOSES)
    : undefined;
  const base = toDraft();
  return {
    name: text("name") ?? base.name,
    brand: text("brand") ?? base.brand,
    doseAmount: text("doseAmount") ?? base.doseAmount,
    doseUnit: oneOf("doseUnit", VACCINE_DOSE_UNITS) ?? base.doseUnit,
    route: oneOf("route", VACCINE_ROUTES) ?? "",
    site: oneOf("site", VACCINE_SITES) ?? "",
    schedule: oneOf("schedule", ["one_time", "recurring"] as const) ?? base.schedule,
    everyCount: text("everyCount") ?? base.everyCount,
    everyUnit: oneOf("everyUnit", INTERVAL_UNITS) ?? base.everyUnit,
    doseCount: text("doseCount") ?? base.doseCount,
    startDose: text("startDose") ?? base.startDose,
    dates: dates?.length ? dates : base.dates,
    instructions: text("instructions") ?? base.instructions,
  };
}

/** Where a half-filled "Add a vaccine" form is kept between openings. */
export type VaccineFormMemory = {
  load: () => unknown;
  save: (form: Draft) => void;
  clear: () => void;
};

const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));

function toInput(d: Draft) {
  return {
    name: d.name,
    brand: d.brand,
    doseAmount: toNumber(d.doseAmount),
    doseUnit: d.doseUnit,
    route: d.route || undefined,
    site: d.site || undefined,
    schedule: d.schedule,
    everyCount: d.schedule === "recurring" ? toNumber(d.everyCount) : undefined,
    everyUnit: d.schedule === "recurring" ? d.everyUnit : undefined,
    startDose: toNumber(d.startDose),
    dates: d.dates,
    instructions: d.instructions,
  };
}

/** Dates rebuilt from the first date and the frequency, as many as the dose count. */
function regenerate(d: Draft): string[] {
  const first = d.dates[0] ?? todayInIndia();
  if (d.schedule === "one_time") return [first];
  const count = Math.min(MAX_DOSES, Math.max(2, Math.trunc(toNumber(d.doseCount)) || 2));
  const every = Math.trunc(toNumber(d.everyCount));
  return buildDoseDates(first, count, every >= 1 ? { count: every, unit: d.everyUnit } : undefined);
}

/**
 * Adds or edits one vaccine on a prescription: what it is, the dose, and every date it is due.
 * Recurring vaccines get their dates worked out from the frequency, and any date can be moved.
 */
export function VaccineDialog({
  open,
  vaccine,
  onSave,
  onClose,
  memory,
}: {
  open: boolean;
  /** The vaccine being edited; empty to add a new one. */
  vaccine?: VaccineInput;
  /** Adding only: keeps what is typed, so closing or a refresh doesn't lose it. */
  memory?: VaccineFormMemory;
  onSave: (vaccine: VaccineInput) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  // Opened by a click, never on the server, so storage can be read straight away.
  const [kept] = useState(() => (!vaccine && memory ? fromStored(memory.load()) : null));
  const [draft, setDraft] = useState(() => kept ?? toDraft(vaccine));
  const [errors, setErrors] = useState<Errors>({});
  const [showKept, setShowKept] = useState(Boolean(kept));

  // Keep what has been typed; an untouched form leaves nothing behind.
  useEffect(() => {
    if (!memory) return;
    if (JSON.stringify(draft) === blankDraft()) memory.clear();
    else memory.save(draft);
  }, [draft, memory]);

  function startOver() {
    setDraft(toDraft());
    setErrors({});
    setShowKept(false);
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function update(change: Partial<Draft>, rebuildDates = false) {
    setDraft((current) => {
      const next = { ...current, ...change };
      return rebuildDates ? { ...next, dates: regenerate(next) } : next;
    });
  }

  function setDate(index: number, day: string) {
    // Moving the first date shifts the rest with it; later dates move on their own.
    setDraft((current) =>
      index === 0
        ? { ...current, dates: regenerate({ ...current, dates: [day] }) }
        : { ...current, dates: current.dates.map((d, i) => (i === index ? day : d)) },
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = vaccineInput.safeParse(toInput(draft));
    if (!parsed.success) {
      const found: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        found[key] ??= issue.message;
      }
      setErrors(found);
      // Take the doctor to the first problem.
      const first = Object.keys(found)[0];
      ref.current?.querySelector<HTMLElement>(`[data-field="${first}"], [data-field="${first.split(".")[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    onSave(parsed.data as VaccineInput);
  }

  const brands = brandSuggestions(draft.name);
  const recurring = draft.schedule === "recurring";
  const startDose = Math.max(1, Math.trunc(toNumber(draft.startDose)) || 1);
  const total = startDose + draft.dates.length - 1;
  const today = todayInIndia();
  const errorFor = (key: string) => errors[key];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="sheet m-0 h-dvh max-h-none w-full max-w-none bg-card p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:h-fit sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-line sm:shadow-floating md:max-w-3xl"
    >
      <form onSubmit={submit} noValidate className="flex h-full flex-col sm:max-h-[90dvh]">
        <div className="border-b border-line pb-3">
          <DialogHeader
            titleId={`${id}-title`}
            title={vaccine ? "Edit vaccine" : "Add a vaccine"}
            icon={Syringe}
            onClose={onClose}
          />
        </div>

        {/* Two columns from md up: what the vaccine is, then when it is given. Wide enough not to scroll. */}
        <div className="flex-1 overflow-y-auto px-5 py-5 md:grid md:grid-cols-2 md:gap-x-8 md:py-4">
          {showKept ? (
            <div
              role="status"
              className="mb-5 flex items-center gap-3 rounded-2xl bg-surface py-1.5 pl-3.5 pr-1.5 text-[13px] md:col-span-2 md:mb-4"
            >
              <History aria-hidden className="size-4 shrink-0 text-muted" />
              <p className="min-w-0 flex-1 font-medium text-ink">Filled in with what you started earlier.</p>
              <button type="button" onClick={startOver} className="btn btn-danger-ghost btn-sm shrink-0">
                Start over
              </button>
            </div>
          ) : null}
          <div>
            <Section title="Vaccine">
              <Field id={`${id}-name`} label="Name" error={errorFor("name")}>
                <input
                  id={`${id}-name`}
                  data-field="name"
                  list={`${id}-names`}
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Start typing, e.g. HPV"
                  autoComplete="off"
                  aria-invalid={Boolean(errorFor("name")) || undefined}
                  className={field}
                />
                <datalist id={`${id}-names`}>
                  {vaccineSuggestions.map((s) => (
                    <option key={s.value} value={s.value} />
                  ))}
                </datalist>
              </Field>
              <Field id={`${id}-brand`} label="Brand" optional error={errorFor("brand")}>
                <input
                  id={`${id}-brand`}
                  data-field="brand"
                  list={`${id}-brands`}
                  value={draft.brand}
                  onChange={(e) => update({ brand: e.target.value })}
                  placeholder={brands.length ? `e.g. ${brands[0]}` : "As on the vial"}
                  autoComplete="off"
                  className={field}
                />
                <datalist id={`${id}-brands`}>
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
            </Section>

            <Section title="Dose">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                <Field id={`${id}-amount`} label="Amount" error={errorFor("doseAmount")}>
                  <input
                    id={`${id}-amount`}
                    data-field="doseAmount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.05"
                    value={draft.doseAmount}
                    onChange={(e) => update({ doseAmount: e.target.value })}
                    aria-invalid={Boolean(errorFor("doseAmount")) || undefined}
                    className={field}
                  />
                </Field>
                <Field id={`${id}-unit`} label="Unit">
                  <select
                    id={`${id}-unit`}
                    value={draft.doseUnit}
                    onChange={(e) => update({ doseUnit: e.target.value as VaccineDoseUnit })}
                    className={field}
                  >
                    {VACCINE_DOSE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id={`${id}-route`} label="Route" error={errorFor("route")}>
                  <select
                    id={`${id}-route`}
                    data-field="route"
                    value={draft.route}
                    onChange={(e) => update({ route: e.target.value as VaccineRoute })}
                    aria-invalid={Boolean(errorFor("route")) || undefined}
                    className={field}
                  >
                    <option value="">Choose</option>
                    {VACCINE_ROUTES.map((r) => (
                      <option key={r} value={r}>
                        {ROUTE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${id}-site`} label="Site" optional>
                  <select
                    id={`${id}-site`}
                    value={draft.site}
                    onChange={(e) => update({ site: e.target.value as VaccineSite })}
                    className={field}
                  >
                    <option value="">Not specified</option>
                    {VACCINE_SITES.map((s) => (
                      <option key={s} value={s}>
                        {SITE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Instructions" optional>
              <label htmlFor={`${id}-instructions`} className="sr-only">
                Instructions
              </label>
              <textarea
                id={`${id}-instructions`}
                data-field="instructions"
                rows={2}
                maxLength={300}
                value={draft.instructions}
                onChange={(e) => update({ instructions: e.target.value })}
                placeholder="e.g. Wait 30 minutes after the shot"
                className={field}
              />
              {errorFor("instructions") ? <FieldError>{errorFor("instructions")}</FieldError> : null}
            </Section>
          </div>

          <div className="mt-5 border-t border-line pt-5 md:mt-0 md:border-t-0 md:pt-0">
            <Section title="Schedule">
              <fieldset>
                <legend className="sr-only">How often</legend>
                <div className="segmented">
                  {(
                    [
                      ["one_time", "One time"],
                      ["recurring", "Recurring"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="segment cursor-pointer py-2 text-center has-checked:bg-white/92 has-checked:text-ink has-checked:shadow-(--glass-shadow-small) has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-brand lg:py-1.5"
                    >
                      <input
                        type="radio"
                        name={`${id}-schedule`}
                        value={value}
                        checked={draft.schedule === value}
                        onChange={() => update({ schedule: value }, true)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {recurring ? (
                <>
                  <div className="grid grid-cols-[auto_5rem_minmax(0,1fr)] items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">Every</span>
                    <Field id={`${id}-every`} label="Every" hideLabel error={errorFor("everyCount")}>
                      <input
                        id={`${id}-every`}
                        data-field="everyCount"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="365"
                        value={draft.everyCount}
                        onChange={(e) => update({ everyCount: e.target.value }, true)}
                        aria-invalid={Boolean(errorFor("everyCount")) || undefined}
                        className={field}
                      />
                    </Field>
                    <Field id={`${id}-every-unit`} label="Unit of time" hideLabel>
                      <select
                        id={`${id}-every-unit`}
                        value={draft.everyUnit}
                        onChange={(e) => update({ everyUnit: e.target.value as IntervalUnit }, true)}
                        className={field}
                      >
                        {INTERVAL_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {errorFor("everyCount") ? <FieldError>{errorFor("everyCount")}</FieldError> : null}
                </>
              ) : null}

              <div className={recurring ? "grid grid-cols-2 gap-3" : ""}>
                {recurring ? (
                  <Field id={`${id}-count`} label="Number of doses" hint={`2 to ${MAX_DOSES}`}>
                    <input
                      id={`${id}-count`}
                      type="number"
                      inputMode="numeric"
                      min="2"
                      max={MAX_DOSES}
                      value={draft.doseCount}
                      onChange={(e) => update({ doseCount: e.target.value }, true)}
                      className={field}
                    />
                  </Field>
                ) : null}
                <Field
                  id={`${id}-start`}
                  label="First dose number"
                  hint="If earlier doses were given elsewhere"
                  error={errorFor("startDose")}
                >
                  <input
                    id={`${id}-start`}
                    data-field="startDose"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={MAX_DOSES}
                    value={draft.startDose}
                    onChange={(e) => update({ startDose: e.target.value })}
                    aria-invalid={Boolean(errorFor("startDose")) || undefined}
                    className={field}
                  />
                </Field>
              </div>
            </Section>

            <Section title={recurring ? "Dates" : "Date"} note={recurring ? "from the first date, change any" : undefined}>
              {errorFor("dates") ? <FieldError>{errorFor("dates")}</FieldError> : null}
              <ol className={`grid gap-x-3 gap-y-2 ${draft.dates.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {draft.dates.map((day, i) => {
                  const key = `dates.${i}`;
                  return (
                    <li key={i}>
                      <Field
                        id={`${id}-date-${i}`}
                        label={total > 1 ? `Dose ${startDose + i} of ${total}` : "Due on"}
                        error={errorFor(key)}
                        compact
                      >
                        <input
                          id={`${id}-date-${i}`}
                          data-field={key}
                          type="date"
                          min={i === 0 ? today : draft.dates[i - 1]}
                          value={day}
                          onChange={(e) => setDate(i, e.target.value)}
                          aria-invalid={Boolean(errorFor(key)) || undefined}
                          className={field}
                        />
                      </Field>
                    </li>
                  );
                })}
              </ol>
            </Section>
          </div>
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {vaccine ? "Save changes" : "Add vaccine"}
          </button>
        </DialogFooter>
      </form>
    </dialog>
  );
}

function Section({
  title,
  optional,
  note,
  children,
}: {
  title: string;
  optional?: boolean;
  /** A short aside after the title, e.g. how the dates were worked out. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-line not-first:mt-5 not-first:border-t not-first:pt-5">
      <h3 className="text-sm font-semibold text-ink">
        {title}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
        {note ? <span className="font-normal text-muted">, {note}</span> : null}
      </h3>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  hideLabel,
  inline,
  compact,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  /** Label beside the input on wider screens. */
  inline?: boolean;
  /** Smaller label and spacing, for the list of dose dates. */
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        inline
          ? "grid gap-1.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:gap-3"
          : `flex flex-col ${compact ? "gap-1" : "gap-1.5"}`
      }
    >
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : compact ? "text-xs font-medium text-body" : "text-[13px] font-semibold text-ink"}
      >
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </label>
      <div className="flex min-w-0 flex-col gap-1">
        {children}
        {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
        {error && !hideLabel ? <FieldError>{error}</FieldError> : null}
      </div>
    </div>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-danger">{children}</p>;
}
