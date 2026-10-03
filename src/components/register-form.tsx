"use client";

import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const councils = [
  "National Medical Commission",
  "Delhi Medical Council",
  "Uttar Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Karnataka Medical Council",
  "Other state medical council",
];

const inputClass =
  "rounded-xl border border-line bg-card px-4 py-3 text-ink placeholder:text-body focus:border-brand focus:outline-none";

const steps = [
  "We check your registration number with the medical council.",
  "You get an SMS when your account is approved, usually within two working days.",
  "Sign in with your mobile number and set your consult hours.",
];

export function RegisterForm({ specialties }: { specialties: string[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <>
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <BadgeCheck aria-hidden className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-bold text-ink">Thank you, {name.trim()}</h1>
        <p className="mt-2 text-body">Your details are with us. Here is what happens next.</p>
        <ol className="mt-6 flex flex-col gap-4">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink">
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full border border-line bg-card px-6 py-3 text-sm font-bold text-ink hover:bg-selected"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Register as a doctor</h1>
      <p className="mt-2 text-body">
        HealthMatrix consults are given by registered medical practitioners. We verify every
        registration before the console opens.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-semibold text-ink">Full name</label>
          <input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr Anjali Mehta"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reg-phone" className="text-sm font-semibold text-ink">Mobile number</label>
          <input
            id="reg-phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            required
            autoComplete="tel-national"
            placeholder="10-digit mobile number"
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-number" className="text-sm font-semibold text-ink">Registration number</label>
            <input id="reg-number" required placeholder="DMC 48217" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="council" className="text-sm font-semibold text-ink">Medical council</label>
            <select id="council" required defaultValue="" className={inputClass}>
              <option value="" disabled>Choose a council</option>
              {councils.map((council) => (
                <option key={council}>{council}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="qualifications" className="text-sm font-semibold text-ink">Qualifications</label>
          <input id="qualifications" required placeholder="MBBS, MD (Medicine)" className={inputClass} />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">Specialties you consult in</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <label
                key={specialty}
                className="cursor-pointer rounded-full border border-line bg-card px-3.5 py-2 text-sm font-semibold text-ink has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-brand"
              >
                <input type="checkbox" name="specialties" value={specialty} className="sr-only" />
                {specialty}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-body">
          <input type="checkbox" required className="mt-1 size-4 accent-brand" />
          I am a registered medical practitioner and will consult under the Telemedicine Practice
          Guidelines, 2020.
        </label>

        <button type="submit" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-danger">
          Submit for verification
        </button>
      </form>

      <p className="mt-6 text-sm text-body">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
