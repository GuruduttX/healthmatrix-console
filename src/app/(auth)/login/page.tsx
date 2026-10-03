import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { signedout } = await props.searchParams;

  return (
    <>
      {signedout ? (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <CircleCheck aria-hidden className="size-4 shrink-0" />
          You have signed out. Open records stay logged in each patient’s app.
        </p>
      ) : null}

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Sign in to the doctor console</h1>
      <p className="mt-2 text-body">
        Enter the mobile number registered with HealthMatrix. We’ll send a one-time password.
      </p>

      <Form action="/login/verify" className="mt-8 flex flex-col gap-2">
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
            pattern="[0-9]{10}"
            maxLength={10}
            required
            placeholder="10-digit mobile number"
            className="min-w-0 flex-1 rounded-r-xl bg-transparent px-4 py-3 text-ink placeholder:text-body focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-danger"
        >
          Send OTP
        </button>
      </Form>

      <p className="mt-6 text-sm text-body">
        New to the network?{" "}
        <Link href="/register" className="font-bold text-brand hover:underline">
          Register as a doctor
        </Link>
      </p>
      <p className="mt-10 text-xs leading-relaxed text-body">
        For registered medical practitioners. Consultations follow India’s Telemedicine Practice
        Guidelines, 2020.
      </p>
    </>
  );
}
