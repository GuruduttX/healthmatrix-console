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
      <p className="text-xs font-bold uppercase tracking-wider text-brand">New doctor</p>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">Join the doctor console</h1>
      <p className="mt-2 text-body">
        Enter your mobile number. After the one-time password, you’ll set up your profile with
        your registration details.
      </p>

      <LoginForm intent="register" />

      <p className="mt-6 text-sm text-body">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-brand hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-10 text-xs leading-relaxed text-body">
        For registered medical practitioners. Consultations follow India’s Telemedicine Practice
        Guidelines, 2020.
      </p>
    </>
  );
}
