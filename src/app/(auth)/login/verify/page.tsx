import { ChevronLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "Enter OTP" };

export default async function VerifyPage(props: PageProps<"/login/verify">) {
  const { phone, error } = await props.searchParams;
  if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) redirect("/login");

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Change number
      </Link>

      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-ink">Enter the OTP</h1>
      <p className="mt-2 text-body">
        We sent a 6-digit code to +91 {phone.slice(0, 5)} {phone.slice(5)}.
      </p>

      {error ? (
        <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          That code is not 6 digits. Check the SMS and try again.
        </p>
      ) : null}

      <form action={signIn} className="mt-8 flex flex-col gap-2">
        <input type="hidden" name="phone" value={phone} />
        <label htmlFor="otp" className="text-sm font-semibold text-ink">
          One-time password
        </label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className="rounded-xl border border-line bg-card px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-ink focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-danger"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-body">
        No code after a minute?{" "}
        <Link href={`/login/verify?phone=${phone}`} className="font-bold text-brand hover:underline">
          Send it again
        </Link>
      </p>
    </>
  );
}
