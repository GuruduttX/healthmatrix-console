import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
        <p className="mb-6 flex items-start gap-2 rounded-2xl bg-success-soft px-3.5 py-3 text-[13px] font-semibold leading-5 text-success">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          You have signed out. Open records stay logged in each patient’s app.
        </p>
      ) : expired ? (
        <p className="mb-6 rounded-2xl bg-surface px-3.5 py-3 text-[13px] font-semibold text-body">
          Your session has ended. Please sign in again.
        </p>
      ) : null}

      <h1 className="font-display text-[1.6875rem] font-bold leading-tight tracking-[-0.015em] text-ink">
        Welcome back, doctor
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-body">
        Enter your registered mobile number. We’ll send a one-time password.
      </p>

      <LoginForm intent="login" />

      <p className="mt-5 text-center text-[13px] text-body">
        New to the network?{" "}
        <Link href="/register" className="font-bold text-brand hover:text-brand-strong">
          Register as a doctor
        </Link>
      </p>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        For registered medical practitioners. Consultations follow India’s Telemedicine Practice
        Guidelines, 2020.
      </p>
    </>
  );
}
