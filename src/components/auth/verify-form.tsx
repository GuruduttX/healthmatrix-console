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
  // A resend sets cookies, so the page re-renders with the new code's `resendAt`.
  const wait = useCountdown(resendAt);

  return (
    <>
      {devCode ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-body">
          No SMS provider is connected yet. Your code:{" "}
          <span className="font-bold tracking-widest text-ink">{devCode}</span>
        </p>
      ) : null}

      <FormMessage error={state.error ?? resent.error} notice={state.error ? undefined : resent.notice} />

      <form action={verify} className="mt-8 flex flex-col gap-2">
        <label htmlFor="otp" className="text-sm font-semibold text-ink">
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
          className="rounded-xl border border-line bg-card px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-ink focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={verifying}
          className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
        >
          {verifying ? "Checking…" : "Continue"}
        </button>
      </form>

      <form action={resend} className="mt-6 text-sm text-body">
        No code after a minute?{" "}
        {wait > 0 ? (
          <span>You can ask again in {wait}s.</span>
        ) : (
          <button type="submit" disabled={resending} className="font-bold text-brand hover:underline disabled:opacity-60">
            {resending ? "Sending…" : "Send it again"}
          </button>
        )}
      </form>
    </>
  );
}
