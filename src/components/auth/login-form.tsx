"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "./form-message";
import { requestOtp, type AuthFormState, type AuthIntent } from "@/lib/auth-actions";

const SWITCH_LINKS = {
  login: { href: "/login", label: "Go to sign in" },
  register: { href: "/register", label: "Register as a new doctor" },
} as const;

/** The mobile number step. `intent` decides whether the number must already be registered. */
export function LoginForm({ intent }: { intent: AuthIntent }) {
  const [state, action, pending] = useActionState(requestOtp, {} satisfies AuthFormState);
  const switchLink = state.switchTo ? SWITCH_LINKS[state.switchTo] : null;

  return (
    <>
      <FormMessage error={state.error} />
      {switchLink ? (
        <Link href={switchLink.href} className="mt-2.5 inline-block text-[13px] font-bold text-brand-deep hover:underline">
          {switchLink.label} →
        </Link>
      ) : null}
      <form action={action} className="mt-6 flex flex-col gap-1.5">
        <input type="hidden" name="intent" value={intent} />
        <label htmlFor="phone" className="text-[13px] font-bold text-body">
          Mobile number
        </label>
        {/* Drawn like a `field`, with +91 inside it, as the app's number field. */}
        <div className="flex min-h-13 items-center gap-1 overflow-hidden rounded-[1rem] border-[1.5px] border-line-strong bg-white/62 pl-4 shadow-(--glass-glow-small) transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(221,67,1,0.12)]">
          <span className="text-base font-semibold tabular-nums text-body">+91</span>
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
            className="min-w-0 flex-1 self-stretch bg-transparent px-2 text-base font-semibold tabular-nums tracking-wide text-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-muted outline-none"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg mt-5 w-full">
          {pending ? "Sending…" : intent === "register" ? "Send OTP to register" : "Send OTP"}
          {pending ? null : <ArrowRight aria-hidden className="size-4.5" />}
        </button>
      </form>
    </>
  );
}
