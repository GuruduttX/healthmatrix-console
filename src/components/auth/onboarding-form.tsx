"use client";

import { BadgeCheck, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { FormMessage } from "./form-message";
import { TagInput } from "./tag-input";
import {
  completeOnboarding,
  type OnboardingField,
  type OnboardingState,
} from "@/lib/auth-actions";
import { canonicalState, languageSuggestions, specialtySuggestions } from "@/lib/onboarding";
import { INDIAN_STATES } from "@/models/constants";

const councils = [
  "National Medical Commission",
  "Delhi Medical Council",
  "Uttar Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Karnataka Medical Council",
  "Other state medical council",
];

/** Step 1 (mobile number and OTP) happens on the sign-in screens before this form. */
const steps = [
  { number: 1, title: "Mobile number" },
  { number: 2, title: "Registration", fields: ["name", "registrationNumber", "council"] },
  { number: 3, title: "Qualifications and specialties", fields: ["qualifications", "specialties"] },
  { number: 4, title: "Languages and location", fields: ["languages", "state", "city", "consent"] },
] as const satisfies readonly { number: number; title: string; fields?: readonly OnboardingField[] }[];

type FormStep = 2 | 3 | 4;
type Errors = Partial<Record<OnboardingField, string>>;

/** Quick checks before moving on. The server checks everything again on submit. */
function checkStep(step: FormStep, data: FormData): Errors {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const errors: Errors = {};
  if (step === 2) {
    if (text("name").length < 2) errors.name = "Enter your full name";
    if (text("registrationNumber").length < 3)
      errors.registrationNumber = "Enter your medical registration number";
  }
  if (step === 3 && data.getAll("specialties").length === 0) {
    errors.specialties = "Add at least one specialty";
  }
  if (step === 4) {
    if (data.getAll("languages").length === 0)
      errors.languages = "Add at least one language you consult in";
    if (!canonicalState(text("state")))
      errors.state = "Choose your state or union territory from the list";
    if (text("city").length < 2) errors.city = "Enter your city";
    if (data.get("consent") !== "on") errors.consent = "Please confirm to continue";
  }
  return errors;
}

/**
 * Where a re-mounted form opens: the first step with a field error, the last step after a
 * submit that failed for another reason, or the start.
 */
function openingStep(errors: Errors, submitted: boolean): FormStep {
  for (const step of steps) {
    if ("fields" in step && step.fields.some((field) => errors[field])) return step.number as FormStep;
  }
  return submitted ? 4 : 2;
}

const inputClass = "field aria-invalid:border-danger";

const labelClass = "text-[13px] font-semibold text-ink";

const optional = <span className="font-normal text-muted">(optional)</span>;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs font-semibold text-danger">
      {message}
    </p>
  ) : null;
}

function Progress({ current }: { current: FormStep }) {
  return (
    <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Onboarding steps">
      {steps.map((step) => {
        const done = step.number < current;
        const here = step.number === current;
        return (
          <li key={step.number} aria-current={here ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${done || here ? "bg-brand" : "bg-selected"}`}
              aria-hidden
            />
            <span
              className={`mt-1.5 block text-[11px] leading-tight ${
                here ? "font-semibold text-ink" : "font-medium text-muted"
              }`}
            >
              {done ? <Check aria-hidden className="mr-0.5 inline size-3 align-[-2px] text-brand" /> : null}
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.number}</span>
              {done ? <span className="sr-only">(done)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Values = NonNullable<OnboardingState["values"]>;

export function OnboardingForm({
  phone,
  isNew,
  initial,
}: {
  phone: string;
  isNew: boolean;
  initial: Values;
}) {
  const [state, action, pending] = useActionState(completeOnboarding, {} satisfies OnboardingState);
  const values = state.values ?? initial;

  return (
    <>
      <h1 className="font-display text-[1.6875rem] font-bold leading-tight tracking-[-0.015em] text-ink">
        {isNew ? "Set up your doctor profile" : "Finish your doctor profile"}
      </h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-success">
        <BadgeCheck aria-hidden className="size-4 shrink-0" />
        {phone} verified
      </p>

      <FormMessage error={state.error} />

      {/* Re-mounted after each attempt so a rejected form comes back filled in, on the right step. */}
      <Steps
        key={state.attempt ?? 0}
        action={action}
        pending={pending}
        values={values}
        serverErrors={state.fieldErrors ?? {}}
        submitted={Boolean(state.attempt)}
      />
    </>
  );
}

function Steps({
  action,
  pending,
  values,
  serverErrors,
  submitted,
}: {
  action: (data: FormData) => void;
  pending: boolean;
  values: Values;
  serverErrors: Errors;
  submitted: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<FormStep>(() => openingStep(serverErrors, submitted));
  const [errors, setErrors] = useState<Errors>(serverErrors);

  const invalid = (field: OnboardingField) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  // After Next or Previous, focus the new step's heading for keyboard and screen reader users.
  // In an effect rather than a later frame, so it can't pull focus from a field being typed in.
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) formRef.current?.querySelector<HTMLElement>(`#step-${step}`)?.focus();
  }, [step]);

  function goTo(next: FormStep) {
    moved.current = true;
    setStep(next);
  }

  function next() {
    if (!formRef.current || step === 4) return;
    const found = checkStep(step, new FormData(formRef.current));
    setErrors(found);
    if (Object.keys(found).length === 0) goTo((step + 1) as FormStep);
  }

  function previous() {
    if (step > 2) {
      setErrors({});
      goTo((step - 1) as FormStep);
    }
  }

  /** Enter on an earlier step means Next, not submit. */
  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    if (event.key === "Enter" && step < 4 && target.tagName === "INPUT") {
      event.preventDefault();
      next();
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const found = checkStep(4, new FormData(event.currentTarget));
    setErrors(found);
    if (Object.keys(found).length) event.preventDefault();
  }

  const heading = (n: FormStep, title: string) => (
    <h2 id={`step-${n}`} tabIndex={-1} className="font-display text-lg font-bold text-ink focus:outline-none">
      <span className="font-sans text-sm font-semibold text-muted">Step {n} of 4 · </span>
      {title}
    </h2>
  );

  return (
    <>
      <Progress current={step} />

      <form
        ref={formRef}
        action={action}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
        noValidate
        className="mt-6"
      >
        {/* Every step stays in the form, hidden when not current, so one submit sends all. */}
        <section hidden={step !== 2} className="flex flex-col gap-4">
          {heading(2, "Name and registration")}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClass}>Full name</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              defaultValue={values.name}
              placeholder="Dr Anjali Mehta"
              className={inputClass}
              {...invalid("name")}
            />
            <FieldError id="name-error" message={errors.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="registrationNumber" className={labelClass}>
              Registration number
            </label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              autoComplete="off"
              defaultValue={values.registrationNumber}
              placeholder="DMC 48217"
              className={inputClass}
              {...invalid("registrationNumber")}
            />
            <FieldError id="registrationNumber-error" message={errors.registrationNumber} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="council" className={labelClass}>
              Medical council {optional}
            </label>
            <select
              id="council"
              name="council"
              defaultValue={values.council}
              className={inputClass}
              {...invalid("council")}
            >
              <option value="">Choose a council</option>
              {(values.council && !councils.includes(values.council)
                ? [values.council, ...councils]
                : councils
              ).map((council) => (
                <option key={council}>{council}</option>
              ))}
            </select>
            <FieldError id="council-error" message={errors.council} />
          </div>
        </section>

        <section hidden={step !== 3} className="flex flex-col gap-4">
          {heading(3, "Qualifications and specialties")}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="qualifications" className={labelClass}>
              Qualifications {optional}
            </label>
            <input
              id="qualifications"
              name="qualifications"
              autoComplete="off"
              defaultValue={values.qualifications}
              placeholder="MBBS, MD (Medicine)"
              className={inputClass}
              {...invalid("qualifications")}
            />
            <FieldError id="qualifications-error" message={errors.qualifications} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="specialties" className={labelClass}>
              Specialties you consult in
            </label>
            <TagInput
              id="specialties"
              name="specialties"
              suggestions={specialtySuggestions}
              defaultValue={values.specialties}
              placeholder="Start typing, e.g. Cardiology"
              invalid={Boolean(errors.specialties)}
              describedBy="specialties-hint specialties-error"
            />
            <p id="specialties-hint" className="text-xs text-muted">
              Pick from the suggestions, or type your own and press Enter.
            </p>
            <FieldError id="specialties-error" message={errors.specialties} />
          </div>
        </section>

        <section hidden={step !== 4} className="flex flex-col gap-4">
          {heading(4, "Languages and location")}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="languages" className={labelClass}>
              Languages you consult in
            </label>
            <TagInput
              id="languages"
              name="languages"
              suggestions={languageSuggestions}
              defaultValue={values.languages}
              placeholder="Start typing, e.g. Hindi"
              invalid={Boolean(errors.languages)}
              describedBy="languages-hint languages-error"
            />
            <p id="languages-hint" className="text-xs text-muted">
              Pick from the suggestions, or type your own and press Enter.
            </p>
            <FieldError id="languages-error" message={errors.languages} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className={labelClass}>
                State or union territory
              </label>
              <input
                id="state"
                name="state"
                list="state-options"
                autoComplete="address-level1"
                defaultValue={values.state}
                placeholder="Start typing"
                className={inputClass}
                {...invalid("state")}
              />
              <datalist id="state-options">
                {INDIAN_STATES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <FieldError id="state-error" message={errors.state} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className={labelClass}>City</label>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                defaultValue={values.city}
                placeholder="New Delhi"
                className={inputClass}
                {...invalid("city")}
              />
              <FieldError id="city-error" message={errors.city} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] border-line-strong bg-card px-4 py-3.5 text-[13px] leading-relaxed text-body transition-colors hover:bg-surface has-checked:border-brand has-checked:bg-brand-soft has-aria-invalid:border-danger">
              <input
                type="checkbox"
                name="consent"
                defaultChecked={values.consent}
                className="mt-0.5 size-4.5 shrink-0 accent-brand"
                {...invalid("consent")}
              />
              I am a registered medical practitioner and will consult under the Telemedicine
              Practice Guidelines, 2020.
            </label>
            <FieldError id="consent-error" message={errors.consent} />
          </div>
        </section>

        <div className="mt-6 flex items-center gap-2 pt-1">
          {step > 2 ? (
            <button type="button" onClick={previous} className="btn btn-secondary btn-lg pl-2.5">
              <ChevronLeft aria-hidden className="size-4 text-muted" />
              Previous
            </button>
          ) : null}
          {/* Separate keys: reusing one element would turn the clicked Next into Submit mid-click. */}
          {step < 4 ? (
            <button
              key="next"
              type="button"
              onClick={next}
              className="btn btn-primary btn-lg ml-auto flex-1"
            >
              Next
              <ChevronRight aria-hidden className="size-4" />
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={pending}
              className="btn btn-primary btn-lg ml-auto flex-1"
            >
              {pending ? "Saving…" : "Open the console"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
