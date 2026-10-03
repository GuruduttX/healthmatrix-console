"use client";

import { useActionState } from "react";

import { FormMessage } from "./form-message";
import { requestOtp, type AuthFormState } from "@/lib/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(requestOtp, {} satisfies AuthFormState);

  return (
    <>
      <FormMessage error={state.error} />
      <form action={action} className="mt-8 flex flex-col gap-2">
        <label htmlFor="phone" className="text-sm font-semibold text-ink">
          Mobile number
        </label>
        <div className="flex items-center rounded-xl border border-line bg-card focus-within:border-brand">
          <span className="border-r border-line px-4 py-3 text-sm font-semibold text-body">+91</span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[6-9][0-9]{9}"
            title="A 10-digit Indian mobile number"
            maxLength={10}
            required
            placeholder="10-digit mobile number"
            className="min-w-0 flex-1 rounded-r-xl bg-transparent px-4 py-3 text-ink placeholder:text-body focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send OTP"}
        </button>
      </form>
    </>
  );
}
