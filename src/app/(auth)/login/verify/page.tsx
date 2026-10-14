import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VerifyForm } from "@/components/auth/verify-form";
import { OTP_RESEND_MS, PHONE_PATTERN } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatPhone } from "@/lib/doctor-view";
import { showOtpOnScreen } from "@/lib/otp-sender";
import { DEV_OTP_COOKIE, OTP_INTENT_COOKIE, OTP_PHONE_COOKIE } from "@/lib/session";
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
  const back = cookieStore.get(OTP_INTENT_COOKIE)?.value === "register" ? "/register" : "/login";
  const devCode = showOtpOnScreen() ? cookieStore.get(DEV_OTP_COOKIE)?.value : undefined;

  return (
    <>
      <Link
        href={back}
        className="-ml-1 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold text-body transition-colors hover:bg-surface hover:text-ink"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full border border-line-strong bg-card shadow-card">
          <ChevronLeft aria-hidden className="size-4" />
        </span>
        Change number
      </Link>

      <h1 className="mt-4 font-display text-[1.6875rem] font-bold leading-tight tracking-[-0.015em] text-ink">
        Enter the OTP
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-body">
        We sent a 6-digit code to <span className="font-bold tabular-nums text-ink">{formatPhone(phone)}</span>.
      </p>

      <VerifyForm resendAt={resendAt} devCode={devCode} />
    </>
  );
}
