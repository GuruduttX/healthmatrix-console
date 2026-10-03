import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VerifyForm } from "@/components/auth/verify-form";
import { OTP_RESEND_MS, PHONE_PATTERN } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatPhone } from "@/lib/doctor-view";
import { DEV_OTP_COOKIE, OTP_PHONE_COOKIE } from "@/lib/session";
import { DoctorOtpChallengeModel } from "@/models";

export const metadata: Metadata = { title: "Enter OTP" };

export default async function VerifyPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get(OTP_PHONE_COOKIE)?.value;
  if (!phone || !PHONE_PATTERN.test(phone)) redirect("/login");

  await connectDB();
  const latest = await DoctorOtpChallengeModel.findOne({ phone }, { createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();
  const resendAt = latest ? latest.createdAt.getTime() + OTP_RESEND_MS : 0;
  const devCode =
    process.env.NODE_ENV === "production" ? undefined : cookieStore.get(DEV_OTP_COOKIE)?.value;

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Change number
      </Link>

      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-ink">Enter the OTP</h1>
      <p className="mt-2 text-body">We sent a 6-digit code to {formatPhone(phone)}.</p>

      <VerifyForm resendAt={resendAt} devCode={devCode} />
    </>
  );
}
