import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession, isProfileComplete } from "@/lib/auth";

export const metadata: Metadata = { title: "Register" };

/** Sign-up: a number not yet on the network gets an OTP, then goes on to onboarding. */
export default async function RegisterPage() {
  const current = await getSession();
  if (current?.doctor?.isActive && isProfileComplete(current.doctor)) redirect("/");

  return (
    <>
      <p className="mb-1 text-[13px] font-bold text-brand-deep">New doctor</p>
      <h1 className="font-display text-[1.6875rem] font-semibold leading-tight tracking-[-0.015em] text-ink">
        Join the doctor console
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-body">
        Enter your mobile number. After the one-time password, you’ll set up your profile with
        your registration details.
      </p>

      <LoginForm intent="register" />

      <p className="mt-5 text-center text-[13px] text-body">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-brand-deep hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        For registered medical practitioners. Consultations follow India’s Telemedicine Practice
        Guidelines, 2020.
      </p>
    </>
  );
}
