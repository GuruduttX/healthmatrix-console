"use client";

import { ChevronLeft, CircleCheck, CircleDashed, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TagInput } from "@/components/auth/tag-input";
import { ABOUT_MAX, languageSuggestions, specialtySuggestions } from "@/lib/onboarding";
import { GAP_LABELS } from "@/lib/profile-gaps";
import {
  updateProfile,
  type ProfileField,
  type ProfileFormState,
  type ProfileValues,
} from "@/lib/profile-actions";
import type { ProfileGap } from "@/lib/types";
import { INDIAN_STATES } from "@/models/constants";

const councils = [
  "National Medical Commission",
  "Delhi Medical Council",
  "Uttar Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Karnataka Medical Council",
  "Other state medical council",
];

const inputClass =
  "w-full rounded-xl border border-line bg-card px-4 py-3 text-ink placeholder:text-body focus:border-brand focus:outline-none aria-invalid:border-danger";

type Errors = Partial<Record<ProfileField, string>>;

/** The field each missing part is filled in at; the photo has its own picker. */
const GAP_FIELDS: Partial<Record<ProfileGap, string>> = {
  qualifications: "qualifications",
  council: "council",
  experience: "experienceYears",
  about: "about",
};

/** Read-only details shown at the end; changing them goes through the HealthMatrix team. */
export type LockedDetails = { phone: string; registrationNumber: string; council: string };

export function ProfileForm({
  initial,
  locked,
  photo,
  progress,
  missing,
  name,
  specialty,
}: {
  initial: ProfileValues;
  locked: LockedDetails;
  /** The photo picker. Kept outside the form: it saves on its own. */
  photo: ReactNode;
  /** How complete the profile is, for the bar under the header. */
  progress: number;
  /** What the profile still lacks, listed beside the form on wide screens. */
  missing: ProfileGap[];
  /** As saved, for the card beside the form. */
  name: string;
  specialty: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, {} satisfies ProfileFormState);
  const router = useRouter();
  /** Asking whether to leave with unsaved changes. */
  const [leaving, setLeaving] = useState(false);

  /** Back to the profile, asking first if there are changes that would be lost. */
  function leave() {
    if (document.querySelector("form[data-dirty='true']")) setLeaving(true);
    else router.push("/profile");
  }

  /** Takes the doctor to the field for a missing part. */
  function goTo(field: string) {
    const el = document.getElementById(field);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Phones: an app-style header in place of the console's top bar. */}
      <header className="sticky top-0 z-20 -mx-4 -mt-5 mb-5 flex items-center gap-2 border-b border-line bg-card/95 px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] backdrop-blur sm:-mx-6 lg:hidden">
        <button
          type="button"
          onClick={leave}
          aria-label="Back to profile"
          className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-selected"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </button>
        <h1 className="flex-1 font-display text-lg font-bold text-ink">Edit profile</h1>
        <span className="pr-3 text-xs font-bold text-body">{progress}% complete</span>
      </header>

      <div className="hidden lg:block">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" />
          Profile and settings
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Edit profile</h1>
        <p className="mt-2 max-w-2xl text-body">Patients see this before they share their record with you.</p>
      </div>

      {/* Phones: one column, photo first. Wide screens: the photo and progress stay beside the form. */}
      <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:mt-6 lg:grid lg:max-w-6xl lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-6 lg:rounded-2xl lg:border lg:border-line lg:bg-card lg:p-6 lg:shadow-card">
          {photo}
          <div className="hidden text-center lg:block">
            <p className="font-display text-lg font-bold text-ink">{name}</p>
            {specialty ? <p className="text-sm text-body">{specialty}</p> : null}
          </div>

          <div className="mx-auto mt-4 max-w-xs lg:mt-6 lg:max-w-none lg:border-t lg:border-line lg:pt-5">
            <p className="mb-2 hidden items-center justify-between text-sm lg:flex">
              <span className="font-semibold text-ink">Profile complete</span>
              <span className="font-bold text-success">{progress}%</span>
            </p>
            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            {missing.length ? (
              <ul className="mt-4 hidden flex-col gap-1 lg:flex">
                {missing.map((gap) => {
                  const field = GAP_FIELDS[gap];
                  const label = `Add ${GAP_LABELS[gap].toLowerCase()}`;
                  return (
                    <li key={gap}>
                      {field ? (
                        <button
                          type="button"
                          onClick={() => goTo(field)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-ink hover:bg-selected"
                        >
                          <CircleDashed aria-hidden className="size-4 shrink-0 text-brand" />
                          {label}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2.5 px-2 py-1.5 text-sm font-semibold text-ink">
                          <CircleDashed aria-hidden className="size-4 shrink-0 text-brand" />
                          {label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 hidden items-center gap-2 text-sm font-semibold text-success lg:flex">
                <CircleCheck aria-hidden className="size-4" />
                Everything patients look for is there.
              </p>
            )}
            <p className="mt-4 hidden text-xs leading-relaxed text-body lg:block">
              A complete profile helps patients trust who they are sharing with.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <FormMessage error={state.error} />

          {/* Re-mounted after each attempt so a rejected form comes back filled in. */}
          <Fields
            key={state.attempt ?? 0}
            action={action}
            pending={pending}
            values={state.values ?? initial}
            errors={state.fieldErrors ?? {}}
            locked={locked}
            attempt={state.attempt ?? 0}
            onCancel={leave}
          />
        </div>
      </div>

      {leaving ? (
        <ConfirmDialog
          title="Discard your changes?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => router.push("/profile")}
          onCancel={() => setLeaving(false)}
        >
          The changes you made to your profile haven’t been saved.
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/**
 * A group of fields. Phones: a small caps label above the card, like a settings app. Wide
 * screens: the title and hint head the card itself.
 */
function Section({
  title,
  hint,
  first = false,
  children,
}: {
  title: string;
  hint?: string;
  /** Lines up with the photo card on wide screens. (`first:` can't tell: React puts hidden inputs ahead of it.) */
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`mt-6 ${first ? "lg:mt-0" : ""}`}>
      <div className="lg:hidden">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-body">{title}</h2>
        {hint ? <p className="mt-1 px-1 text-xs text-body">{hint}</p> : null}
      </div>
      <div className="mt-2 rounded-2xl border border-line bg-card shadow-card lg:mt-0">
        <div className="hidden border-b border-line px-6 py-4 lg:block">
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          {hint ? <p className="mt-0.5 text-sm text-body">{hint}</p> : null}
        </div>
        <div className="flex flex-col gap-5 p-4 sm:p-5 lg:p-6">{children}</div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label} {optional ? <span className="font-normal text-body">(optional)</span> : null}
      </label>
      {children}
      {hint}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Fields({
  action,
  pending,
  values,
  errors,
  locked,
  attempt,
  onCancel,
}: {
  action: (data: FormData) => void;
  onCancel: () => void;
  pending: boolean;
  values: ProfileValues;
  errors: Errors;
  locked: LockedDetails;
  attempt: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Back after a failed save leaves changes the doctor made, so a rejected form counts as changed.
  const [dirty, setDirty] = useState(attempt > 0);
  const [aboutLength, setAboutLength] = useState(values.about.length);

  const invalid = (field: ProfileField) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  // After a rejected save, take the doctor to the first field that needs fixing.
  useEffect(() => {
    if (attempt === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    first?.focus({ preventScroll: true });
  }, [attempt]);

  // Leaving the page with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  return (
    <form
      ref={formRef}
      action={action}
      onInput={markDirty}
      onChange={markDirty}
      data-dirty={dirty}
      noValidate
      // Room for the save bar that floats over the bottom on phones.
      className="pb-24 lg:pb-0"
    >
      <Section first title="About you" hint="Your name, training and a few lines in your own words.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Full name" error={errors.name}>
            <input
              id="name"
              name="name"
              autoComplete="name"
              defaultValue={values.name}
              placeholder="Dr Anjali Mehta"
              className={inputClass}
              {...invalid("name")}
            />
          </Field>
          <Field id="qualifications" label="Qualifications" optional error={errors.qualifications}>
            <input
              id="qualifications"
              name="qualifications"
              autoComplete="off"
              defaultValue={values.qualifications}
              placeholder="MBBS, MD (Medicine)"
              className={inputClass}
              {...invalid("qualifications")}
            />
          </Field>
        </div>
        <Field id="experienceYears" label="Years of experience" optional error={errors.experienceYears}>
          <input
            id="experienceYears"
            name="experienceYears"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            autoComplete="off"
            defaultValue={values.experienceYears}
            placeholder="12"
            className={`${inputClass} max-w-40`}
            {...invalid("experienceYears")}
          />
        </Field>
        <Field
          id="about"
          label="About you"
          optional
          error={errors.about}
          hint={
            <p className="text-right text-xs text-body" aria-live="polite">
              {aboutLength}/{ABOUT_MAX}
            </p>
          }
        >
          <textarea
            id="about"
            name="about"
            rows={4}
            maxLength={ABOUT_MAX}
            defaultValue={values.about}
            onChange={(e) => setAboutLength(e.target.value.length)}
            placeholder="Your approach, the conditions you see most, where you practise."
            className={`${inputClass} resize-y`}
            {...invalid("about")}
          />
        </Field>
      </Section>

      <Section title="Practice" hint="Patients find you by these.">
        <div className="grid gap-5 xl:grid-cols-2">
          <Field
            id="specialties"
            label="Specialties you consult in"
            error={errors.specialties}
            hint={<p id="specialties-hint" className="text-xs text-body">Pick from the suggestions, or type your own and press Enter.</p>}
          >
            <TagInput
              id="specialties"
              name="specialties"
              suggestions={specialtySuggestions}
              defaultValue={values.specialties}
              placeholder="Start typing, e.g. Cardiology"
              invalid={Boolean(errors.specialties)}
              describedBy="specialties-hint specialties-error"
              onChange={markDirty}
            />
          </Field>
          <Field
            id="languages"
            label="Languages you consult in"
            error={errors.languages}
            hint={<p id="languages-hint" className="text-xs text-body">Pick from the suggestions, or type your own and press Enter.</p>}
          >
            <TagInput
              id="languages"
              name="languages"
              suggestions={languageSuggestions}
              defaultValue={values.languages}
              placeholder="Start typing, e.g. Hindi"
              invalid={Boolean(errors.languages)}
              describedBy="languages-hint languages-error"
              onChange={markDirty}
            />
          </Field>
        </div>
      </Section>

      <Section title="Location" hint="Where you practise.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="state" label="State or union territory" error={errors.state}>
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
          </Field>
          <Field id="city" label="City" error={errors.city}>
            <input
              id="city"
              name="city"
              autoComplete="address-level2"
              defaultValue={values.city}
              placeholder="New Delhi"
              className={inputClass}
              {...invalid("city")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Registration" hint="To change these, write to the HealthMatrix team.">
        <dl className="-my-2 divide-y divide-line lg:my-0 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] lg:gap-3 lg:divide-y-0">
          {[
            { term: "Mobile number", value: locked.phone },
            { term: "Registration number", value: locked.registrationNumber },
            ...(locked.council ? [{ term: "Medical council", value: locked.council }] : []),
          ].map((row) => (
            <div
              key={row.term}
              className="flex items-center justify-between gap-4 py-3 text-sm lg:flex-col lg:items-start lg:gap-1 lg:rounded-xl lg:bg-surface lg:px-4"
            >
              <dt className="font-semibold text-body lg:text-xs">{row.term}</dt>
              <dd className="flex min-w-0 max-w-full items-center gap-2 font-medium text-ink">
                <span className="truncate">{row.value}</span>
                <Lock aria-label="Locked" className="size-3.5 shrink-0 text-muted" />
              </dd>
            </div>
          ))}
        </dl>
        {/* Not set at onboarding: the doctor may add it once. */}
        {locked.council ? null : (
          <Field id="council" label="Medical council" optional error={errors.council}>
            <select id="council" name="council" defaultValue={values.council} className={inputClass} {...invalid("council")}>
              <option value="">Choose a council</option>
              {councils.map((council) => (
                <option key={council}>{council}</option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      {/* Phones: floats over the bottom like an app's action bar. Wide screens: sticks to the bottom of the form column. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:sticky lg:bottom-4 lg:mt-6 lg:rounded-2xl lg:border lg:px-5 lg:py-3 lg:shadow-floating print:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3 lg:max-w-none">
          <p className="mr-auto hidden text-sm font-semibold lg:block">
            {dirty ? <span className="text-warning">Unsaved changes</span> : <span className="text-body">No changes yet</span>}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="hidden rounded-full border border-line bg-card px-5 py-3 text-sm font-bold text-ink hover:bg-selected lg:inline-flex"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-brand px-6 py-3.5 text-base font-bold text-white hover:bg-danger disabled:opacity-60 lg:w-auto lg:py-3 lg:text-sm"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
