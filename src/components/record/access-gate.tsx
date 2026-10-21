"use client";

import { KeyRound, Lock, LockOpen, ShieldCheck } from "lucide-react";
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
        {/* A pill of glass on the page, its lock in a round tinted the colour of "open". */}
        <p className="glass-small mb-5 flex w-fit max-w-full items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-4 text-[13px] font-semibold leading-snug text-ink-mid">
          <span data-tone="success" className="brand-tile size-7">
            <LockOpen aria-hidden className="size-3.5" />
          </span>
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
    <section className="glass-panel mx-auto max-w-xl rounded-2xl px-5 py-7 text-center sm:p-8">
      {/* The app's empty-state look: the icon in a round of glass on a soft halo. */}
      <span aria-hidden className="mx-auto inline-flex size-19 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
        <span className="glass-small inline-flex size-13.5 items-center justify-center rounded-full">
          {waiting ? <KeyRound className="size-6" /> : <Lock className="size-6" />}
        </span>
      </span>
      <h2 className="mt-4 font-display text-[1.375rem] font-semibold tracking-[-0.01em] text-ink">
        {waiting ? "Enter the OTP" : "This record is locked"}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-body">
        {waiting
          ? `${note}.`
          : `${note}. The full history opens only after ${patient.firstName}, or a nominee they chose, shares a one-time password.`}
      </p>

      {requested.devCode && waiting ? (
        <p className="mt-4 rounded-2xl bg-warning-soft px-3.5 py-2.5 text-[13px] font-semibold text-warning">
          Test mode, no SMS sent: the OTP is {requested.devCode}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      ) : null}

      {waiting ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <form action={verify} className="flex w-full max-w-64 flex-col items-center gap-3">
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
              className="field h-14 w-full rounded-2xl indent-[0.35em] text-center font-display text-2xl! font-bold tabular-nums tracking-[0.35em] placeholder:indent-0 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            />
            <button type="submit" disabled={verifying} className="btn btn-primary w-full">
              {verifying ? "Checking…" : "Open record"}
            </button>
          </form>
          <form action={request}>
            {sendToField}
            <button
              type="submit"
              disabled={requesting}
              className="btn btn-ghost btn-sm"
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
              <legend className="text-[13px] font-bold text-ink">Send the OTP to</legend>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
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
                    className="cursor-pointer rounded-2xl border-[1.5px] border-line-strong bg-white/60 p-3.5 transition-colors hover:bg-white/80 has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-2 has-focus-visible:outline-brand"
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
          <button type="submit" disabled={requesting} className="btn btn-primary mt-6 w-full sm:w-auto">
            {requesting ? "Sending…" : "Request access with an OTP"}
          </button>
        </form>
      )}

      <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-1.5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" />
        <span>
        Access expires on its own after 24 hours. Every view is logged, and {patient.firstName} can see
        who opened the record.
        </span>
      </p>
    </section>
  );
}
