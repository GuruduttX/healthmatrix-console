"use client";

import { KeyRound, Lock, LockOpen } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";

import { requestRecordAccess, verifyRecordAccess, type AccessFormState } from "@/lib/console-actions";
import type { Nominee, Patient } from "@/lib/types";

const initial: AccessFormState = {};

/**
 * Layer-2 access: the full record stays locked until the patient, or the nominee they chose,
 * reads out a one-time password. The page only loads the record once access is active, so
 * nothing private reaches the browser while it is locked.
 */
export function AccessGate({
  patient,
  nominee,
  children,
}: {
  patient: Patient;
  nominee?: Nominee;
  children?: ReactNode;
}) {
  const [sendTo, setSendTo] = useState<"patient" | "nominee">("patient");
  const [requested, request, requesting] = useActionState(requestRecordAccess.bind(null, patient.id), initial);
  const [verified, verify, verifying] = useActionState(verifyRecordAccess.bind(null, patient.id), initial);
  const { status, note } = patient.access;

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

  const waiting = status === "pending";
  const error = (waiting ? verified.error : undefined) ?? requested.error;
  const sendToField = <input type="hidden" name="sendTo" value={sendTo} />;

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-line bg-card p-6 text-center shadow-card sm:p-8">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        {waiting ? <KeyRound aria-hidden className="size-6" /> : <Lock aria-hidden className="size-6" />}
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-ink">
        {waiting ? "Enter the OTP" : "This record is locked"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body">
        {waiting
          ? `${note}.`
          : `${note}. The full history opens only after ${patient.firstName}, or a nominee they chose, shares a one-time password.`}
      </p>

      {requested.devCode && waiting ? (
        <p className="mt-4 rounded-xl bg-warning-soft px-4 py-2.5 text-sm font-semibold text-warning">
          Development only: the OTP is {requested.devCode}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      {waiting ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <form action={verify} className="flex flex-col items-center gap-3">
            <label htmlFor="access-otp" className="sr-only">
              Six-digit OTP
            </label>
            <input
              id="access-otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="6-digit OTP"
              className="w-52 rounded-xl border border-line bg-surface px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-ink placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:text-body focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={verifying}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
            >
              {verifying ? "Checking…" : "Open record"}
            </button>
          </form>
          <form action={request}>
            {sendToField}
            <button
              type="submit"
              disabled={requesting}
              className="text-sm font-semibold text-body underline disabled:opacity-60"
            >
              {requesting ? "Sending…" : "Send the OTP again"}
            </button>
          </form>
        </div>
      ) : (
        <form action={request}>
          {sendToField}
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
                      name="send-to-choice"
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
            type="submit"
            disabled={requesting}
            className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
          >
            {requesting ? "Sending…" : "Request access with an OTP"}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs leading-relaxed text-body">
        Access expires on its own after 24 hours. Every view is logged, and {patient.firstName} can see
        who opened the record.
      </p>
    </section>
  );
}
