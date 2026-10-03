import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession, isProfileComplete } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const current = await getSession();
  if (current?.doctor?.isActive && isProfileComplete(current.doctor)) redirect("/");

  const { signedout, expired } = await props.searchParams;

  return (
    <>
      {signedout ? (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <CircleCheck aria-hidden className="size-4 shrink-0" />
          You have signed out. Open records stay logged in each patient’s app.
        </p>
      ) : expired ? (
        <p className="mb-6 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-body">
          Your session has ended. Please sign in again.
        </p>
      ) : null}

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Sign in to the doctor console</h1>
      <p className="mt-2 text-body">
        Enter your mobile number. We’ll send a one-time password.
      </p>

      <LoginForm />

      <p className="mt-6 text-sm text-body">
        New to the network? Use your mobile number above to get started. You’ll set up your
        profile after the OTP.
      </p>
      <p className="mt-10 text-xs leading-relaxed text-body">
        For registered medical practitioners. Consultations follow India’s Telemedicine Practice
        Guidelines, 2020.
      </p>
    </>
  );
}
