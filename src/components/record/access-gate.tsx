"use client";

import { KeyRound, Lock, LockOpen } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import type { Nominee, Patient } from "@/lib/types";

/**
 * Layer-2 access: the full record stays locked until the patient, or the nominee
 * they chose, shares a one-time password. Any six digits unlock it on sample data.
 */
export function AccessGate({
  patient,
  nominee,
  children,
}: {
  patient: Patient;
  nominee?: Nominee;
  children: ReactNode;
}) {
  const [status, setStatus] = useState(patient.access.status);
  const [note, setNote] = useState(patient.access.note);
  const [sendTo, setSendTo] = useState<"patient" | "nominee">("patient");
  const [otp, setOtp] = useState("");

  if (status === "active") {
    return (
      <>
        <p className="mb-5 flex w-fit max-w-full items-center gap-2 rounded-2xl bg-success-soft px-3.5 py-1.5 text-sm font-semibold text-success">
          <LockOpen aria-hidden className="size-4 shrink-0" />
          {note}
        </p>
        {children}
      </>
    );
  }

  const recipient = sendTo === "nominee" && nominee ? nominee.name.split(" ")[0] : patient.firstName;

  function requestOtp() {
    setStatus("pending");
    setNote(`OTP sent to ${recipient} just now, waiting for it to be shared`);
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    setStatus("active");
    setNote(
      sendTo === "nominee"
        ? `Opened with nominee ${recipient}’s OTP just now, expires in 24 h`
        : `Opened with ${recipient}’s OTP just now, expires in 24 h`,
    );
  }

  const waiting = status === "pending";

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-8 text-center shadow-card">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        {waiting ? <KeyRound aria-hidden className="size-6" /> : <Lock aria-hidden className="size-6" />}
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-ink">
        {waiting ? "Enter the OTP" : "This record is locked"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body">
        {waiting
          ? note + "."
          : `${patient.access.note}. The full history opens only after ${patient.firstName}, or a nominee they chose, shares a one-time password.`}
      </p>

      {waiting ? (
        <form onSubmit={verify} className="mt-6 flex flex-col items-center gap-3">
          <label htmlFor="otp" className="sr-only">
            Six-digit OTP
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit OTP"
            className="w-52 rounded-xl border border-line bg-surface px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-ink placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-body focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-danger"
          >
            Open record
          </button>
          <button type="button" onClick={requestOtp} className="text-sm font-semibold text-body underline">
            Send the OTP again
          </button>
        </form>
      ) : (
        <>
          {nominee ? (
            <fieldset className="mt-6 text-left">
              <legend className="text-sm font-semibold text-ink">Send the OTP to</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: "patient", title: patient.name, hint: "The patient" },
                    {
                      value: "nominee",
                      title: nominee.name,
                      hint: `Nominee (${nominee.relation}), if ${patient.firstName} can’t respond`,
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className="cursor-pointer rounded-xl border border-line p-3 has-checked:border-brand has-checked:bg-brand-soft"
                  >
                    <input
                      type="radio"
                      name="send-to"
                      value={option.value}
                      checked={sendTo === option.value}
                      onChange={() => setSendTo(option.value)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-bold text-ink">{option.title}</span>
                    <span className="mt-0.5 block text-xs text-body">{option.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <button
            type="button"
            onClick={requestOtp}
            className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-danger"
          >
            Request access with an OTP
          </button>
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-body">
        Access expires on its own after 24 hours. Every view is logged, and {patient.firstName} can see
        who opened the record.
      </p>
    </section>
  );
}
