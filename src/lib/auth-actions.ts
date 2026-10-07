"use server";

import { timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createSession,
  destroySession,
  generateOtp,
  getSession,
  hashOtp,
  isProfileComplete,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  PHONE_PATTERN,
  upgradeSession,
} from "./auth";
import { connectDB } from "./db";
import { OtpDeliveryError, sendOtp } from "./otp-sender";
import { DEV_OTP_COOKIE, OTP_INTENT_COOKIE, OTP_PHONE_COOKIE } from "./session";
import { canonicalList, languageSuggestions, specialtySuggestions } from "./onboarding";
import { profileFields } from "./profile-schema";
import { DoctorModel, DoctorOtpChallengeModel } from "@/models";

export type AuthFormState = {
  error?: string;
  notice?: string;
  /** The other page to offer when the number doesn't fit this one. */
  switchTo?: "login" | "register";
};

/** "login" needs a registered number; "register" needs one that isn't registered yet. */
export type AuthIntent = "login" | "register";

const DISABLED = "This account is switched off. Write to the HealthMatrix team to turn it back on.";
const NOT_REGISTERED = "This number does not exist on HealthMatrix. Check it, or register as a new doctor.";
const ALREADY_REGISTERED = "This number is already registered. Sign in instead.";

/**
 * Keeps the phone being verified out of the URL. Lives as long as the code. Path `/` so
 * both the sign-in and register pages (and their actions) can read it.
 */
const otpCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: OTP_TTL_MS / 1000,
};

const parseIntent = (value: unknown): AuthIntent => (value === "register" ? "register" : "login");

/** The intent the current code was asked for with. */
async function otpIntent(): Promise<AuthIntent> {
  return parseIntent((await cookies()).get(OTP_INTENT_COOKIE)?.value);
}

/**
 * Whether this number may go ahead with this intent. Signing in needs a doctor record;
 * registering is refused once the profile is complete (a half-finished one may carry on).
 */
function checkIntent(
  intent: AuthIntent,
  doctor: Parameters<typeof isProfileComplete>[0] | null,
): AuthFormState | null {
  if (doctor && !doctor.isActive) return { error: DISABLED };
  if (intent === "login" && !doctor) return { error: NOT_REGISTERED, switchTo: "register" };
  if (intent === "register" && doctor && isProfileComplete(doctor)) return { error: ALREADY_REGISTERED, switchTo: "login" };
  return null;
}

/** Creates and sends a fresh code, or says why not. */
async function issueOtp(phone: string, intent: AuthIntent): Promise<AuthFormState | null> {
  await connectDB();

  const doctor = await DoctorModel.findOne({ phone }).lean();
  const refused = checkIntent(intent, doctor);
  if (refused) return refused;

  const recent = await DoctorOtpChallengeModel.findOne({ phone }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_MS) {
    return { error: "Please wait a few seconds before asking for another code." };
  }

  const code = generateOtp();
  await DoctorOtpChallengeModel.deleteMany({ phone });
  await DoctorOtpChallengeModel.create({
    phone,
    codeHash: hashOtp(phone, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  let devCode: string | undefined;
  try {
    ({ devCode } = await sendOtp(phone, code));
  } catch (error) {
    await DoctorOtpChallengeModel.deleteMany({ phone });
    if (error instanceof OtpDeliveryError) return { error: error.message };
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.set(OTP_PHONE_COOKIE, phone, otpCookieOptions);
  cookieStore.set(OTP_INTENT_COOKIE, intent, otpCookieOptions);
  if (devCode) cookieStore.set(DEV_OTP_COOKIE, devCode, otpCookieOptions);
  return null;
}

/** Step 1: send a code to the mobile number, for signing in or for registering. */
export async function requestOtp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const intent = parseIntent(formData.get("intent"));
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);
  if (!PHONE_PATTERN.test(phone)) return { error: "Enter a valid 10-digit mobile number." };

  // A second tap, or a resubmitted form, from the browser that just got a code for this number
  // and intent: take it to the code screen rather than refusing.
  const cookieStore = await cookies();
  if (
    cookieStore.get(OTP_PHONE_COOKIE)?.value === phone &&
    parseIntent(cookieStore.get(OTP_INTENT_COOKIE)?.value) === intent
  ) {
    await connectDB();
    const recent = await DoctorOtpChallengeModel.exists({
      phone,
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_MS) },
      expiresAt: { $gt: new Date() },
    });
    if (recent) redirect("/login/verify");
  }

  const failure = await issueOtp(phone, intent);
  if (failure) return failure;
  redirect("/login/verify");
}

/** "Send it again" on the code screen. */
export async function resendOtp(): Promise<AuthFormState> {
  const phone = (await cookies()).get(OTP_PHONE_COOKIE)?.value;
  if (!phone || !PHONE_PATTERN.test(phone)) redirect("/login");

  const failure = await issueOtp(phone, await otpIntent());
  return failure ?? { notice: "We sent a new code." };
}

/** Step 2: check the code, then sign in, or start onboarding when registering. */
export async function verifyOtp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const cookieStore = await cookies();
  const phone = cookieStore.get(OTP_PHONE_COOKIE)?.value;
  if (!phone || !PHONE_PATTERN.test(phone)) redirect("/login");

  const code = String(formData.get("otp") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from the SMS." };

  await connectDB();
  const challenge = await DoctorOtpChallengeModel.findOne({
    phone,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!challenge) return { error: "This code has expired. Ask for a new one." };

  const expected = Buffer.from(challenge.codeHash, "hex");
  const actual = Buffer.from(hashOtp(phone, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    challenge.attempts += 1;
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await challenge.deleteOne();
      return { error: "Too many wrong codes. Ask for a new one." };
    }
    await challenge.save();
    const left = OTP_MAX_ATTEMPTS - challenge.attempts;
    return { error: `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` };
  }
  await challenge.deleteOne();

  // Checked again: the number may have been registered (or switched off) since the code was sent.
  const doctor = await DoctorModel.findOne({ phone }).lean();
  const refused = checkIntent(await otpIntent(), doctor);
  if (refused) return refused;

  for (const name of [OTP_PHONE_COOKIE, OTP_INTENT_COOKIE, DEV_OTP_COOKIE]) {
    cookieStore.delete({ name, path: "/" });
  }
  await createSession(phone, doctor?._id);
  redirect(doctor && isProfileComplete(doctor) ? "/" : "/onboarding");
}

export type OnboardingField =
  | "name"
  | "registrationNumber"
  | "council"
  | "qualifications"
  | "specialties"
  | "languages"
  | "state"
  | "city"
  | "consent";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Partial<Record<OnboardingField, string>>;
  /** What was submitted, so a rejected form comes back filled in. */
  values?: {
    name: string;
    registrationNumber: string;
    council: string;
    qualifications: string;
    specialties: string[];
    languages: string[];
    state: string;
    city: string;
    consent: boolean;
  };
  attempt?: number;
};

const onboardingSchema = z.object({
  name: profileFields.name,
  registrationNumber: profileFields.registrationNumber,
  council: profileFields.council,
  qualifications: profileFields.qualifications,
  specialties: profileFields.specialties,
  languages: profileFields.languages,
  state: profileFields.state,
  city: profileFields.city,
  consent: z.literal(true, { error: "Please confirm to continue" }),
});

/** Steps 2–4 for a new doctor: the profile, sent once from the last step. Creates the doctor, or completes an existing one. */
export async function completeOnboarding(
  prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const current = await getSession();
  if (!current) redirect("/login?expired=1");
  const { session } = current;

  const values = {
    name: String(formData.get("name") ?? ""),
    registrationNumber: String(formData.get("registrationNumber") ?? ""),
    council: String(formData.get("council") ?? ""),
    qualifications: String(formData.get("qualifications") ?? ""),
    specialties: canonicalList(formData.getAll("specialties").map(String), specialtySuggestions),
    languages: canonicalList(formData.getAll("languages").map(String), languageSuggestions),
    state: String(formData.get("state") ?? ""),
    city: String(formData.get("city") ?? ""),
    consent: formData.get("consent") === "on",
  };
  const attempt = (prev.attempt ?? 0) + 1;

  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: OnboardingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as OnboardingField;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors, values, attempt };
  }
  const { name, registrationNumber, specialties, languages, state, city, council, qualifications } =
    parsed.data;

  await connectDB();
  // The phone comes from the verified session, never from the form.
  const existing = await DoctorModel.findOne({ phone: session.phone }, { isActive: 1 }).lean();
  if (existing && !existing.isActive) return { error: DISABLED, values, attempt };

  // Optional fields left blank are cleared, so the profile shows what was submitted.
  const set: Record<string, unknown> = {
    name,
    registrationNumber,
    specialties,
    languages,
    state,
    city,
    telemedicineConsentAt: new Date(),
  };
  const unset: Record<string, 1> = {};
  if (council) set.council = council;
  else unset.council = 1;
  if (qualifications) set.qualifications = qualifications;
  else unset.qualifications = 1;

  const doctor = await DoctorModel.findOneAndUpdate(
    { phone: session.phone },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  );

  // The console sends incomplete profiles back here; say so rather than loop.
  if (!isProfileComplete(doctor.toObject())) {
    console.error("[onboarding] Saved profile is still incomplete", doctor._id);
    return { error: "We couldn’t save your profile. Please try again.", values, attempt };
  }

  if (!session.doctor) await upgradeSession(session._id, doctor._id);
  redirect("/");
}

export async function signOut() {
  await destroySession();
  redirect("/login?signedout=1");
}
