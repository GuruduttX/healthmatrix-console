"use client";

import { useActionState, useEffect, useState } from "react";

import { FormMessage } from "./form-message";
import { resendOtp, verifyOtp, type AuthFormState } from "@/lib/auth-actions";

/** Seconds until another code can be sent, counting down. */
function useCountdown(until: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [until, now]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function VerifyForm({ resendAt, devCode }: { resendAt: number; devCode?: string }) {
  const [state, verify, verifying] = useActionState(verifyOtp, {} satisfies AuthFormState);
  const [resent, resend, resending] = useActionState(resendOtp, {} satisfies AuthFormState);
  const navigateTo = state.navigateTo ?? resent.navigateTo;
  useEffect(() => {
    if (navigateTo) window.location.assign(navigateTo);
  }, [navigateTo]);
  // A resend sets cookies, so the page re-renders with the new code's `resendAt`.
  const wait = useCountdown(resendAt);

  return (
    <>
      {devCode ? (
        <p className="mt-4 rounded-2xl bg-warning-soft px-3.5 py-3 text-[13px] font-medium text-warning">
          No SMS provider is connected yet. Your code:{" "}
          <span className="font-semibold tabular-nums tracking-[0.2em] text-ink">{devCode}</span>
        </p>
      ) : null}

      <FormMessage error={state.error ?? resent.error} notice={state.error ? undefined : resent.notice} />

      <form action={verify} className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="otp" className="text-[13px] font-bold text-body">
          One-time password
        </label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          title="The 6-digit code"
          maxLength={6}
          required
          autoFocus
          // The spacing after the last digit would pull the code left of centre; the indent evens it out.
          className="field h-15 indent-[0.5em] text-center font-display text-[1.625rem]! font-semibold! tabular-nums tracking-[0.5em]"
        />
        <button type="submit" disabled={verifying || Boolean(navigateTo)} className="btn btn-primary btn-lg mt-5 w-full">
          {verifying ? "Checking…" : "Continue"}
        </button>
      </form>

      <form action={resend} className="mt-5 text-[13px] text-body">
        No code after a minute?{" "}
        {wait > 0 ? (
          <span className="text-muted">
            You can ask again in <span className="tabular-nums">{wait}s</span>.
          </span>
        ) : (
          <button type="submit" disabled={resending} className="font-bold text-brand-deep hover:underline disabled:opacity-60">
            {resending ? "Sending…" : "Send it again"}
          </button>
        )}
      </form>
    </>
  );
}
