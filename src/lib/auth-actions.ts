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
import { DEV_OTP_COOKIE, OTP_PHONE_COOKIE } from "./session";
import {
  canonicalList,
  canonicalState,
  languageSuggestions,
  specialtySuggestions,
  type Suggestion,
} from "./onboarding";
import { DoctorModel, DoctorOtpChallengeModel } from "@/models";

export type AuthFormState = { error?: string; notice?: string };

const DISABLED = "This account is switched off. Write to the HealthMatrix team to turn it back on.";

/** Keeps the phone being verified out of the URL. Lives as long as the code. */
const otpCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/login",
  maxAge: OTP_TTL_MS / 1000,
};

/** Creates and sends a fresh code, or says why not. */
async function issueOtp(phone: string): Promise<AuthFormState | null> {
  await connectDB();

  const doctor = await DoctorModel.findOne({ phone }, { isActive: 1 }).lean();
  if (doctor && !doctor.isActive) return { error: DISABLED };

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
  if (devCode) cookieStore.set(DEV_OTP_COOKIE, devCode, otpCookieOptions);
  return null;
}

/** Step 1: send a code to the mobile number. Works the same for new and returning doctors. */
export async function requestOtp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);
  if (!PHONE_PATTERN.test(phone)) return { error: "Enter a valid 10-digit mobile number." };

  // A second tap, or a resubmitted form, from the browser that just got a code for this number:
  // take it to the code screen rather than refusing.
  if ((await cookies()).get(OTP_PHONE_COOKIE)?.value === phone) {
    await connectDB();
    const recent = await DoctorOtpChallengeModel.exists({
      phone,
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_MS) },
      expiresAt: { $gt: new Date() },
    });
    if (recent) redirect("/login/verify");
  }

  const failure = await issueOtp(phone);
  if (failure) return failure;
  redirect("/login/verify");
}

/** "Send it again" on the code screen. */
export async function resendOtp(): Promise<AuthFormState> {
  const phone = (await cookies()).get(OTP_PHONE_COOKIE)?.value;
  if (!phone || !PHONE_PATTERN.test(phone)) redirect("/login");

  const failure = await issueOtp(phone);
  return failure ?? { notice: "We sent a new code." };
}

/** Step 2: check the code, then sign in, or start onboarding for a new number. */
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

  const doctor = await DoctorModel.findOne({ phone }).lean();
  if (doctor && !doctor.isActive) return { error: DISABLED };

  cookieStore.delete({ name: OTP_PHONE_COOKIE, path: "/login" });
  cookieStore.delete({ name: DEV_OTP_COOKIE, path: "/login" });
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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => value || undefined);

/** A typed specialty or language: starts with a letter, no digits or odd symbols. */
/**
 * Suggestions pass as they are (the app's specialties are keys like `general_medicine`);
 * only what the doctor typed is checked.
 */
const entry = (suggestions: Suggestion[], max: number, message: string) => {
  const known = new Set(suggestions.map((s) => s.value));
  const typed = /^\p{L}[\p{L}\p{M} &()\/.'-]*$/u;
  return z
    .string()
    .refine((value) => known.has(value) || (value.length >= 2 && typed.test(value)), message)
    .refine((value) => known.has(value) || value.length <= max, `Keep each under ${max} characters`);
};

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Keep this under 80 characters"),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Enter your medical registration number")
    .max(40, "Keep this under 40 characters"),
  council: optionalText(80),
  qualifications: optionalText(120),
  specialties: z
    .array(entry(specialtySuggestions, 50, "Specialties can use letters, spaces and & ( ) / - only"))
    .min(1, "Add at least one specialty")
    .max(10, "Add up to 10 specialties"),
  languages: z
    .array(entry(languageSuggestions, 30, "Languages can use letters and spaces only"))
    .min(1, "Add at least one language you consult in")
    .max(12, "Add up to 12 languages"),
  state: z
    .string()
    .transform((state): string => canonicalState(state) ?? "")
    .pipe(z.string().min(1, "Choose your state or union territory from the list")),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(60, "Keep this under 60 characters")
    .regex(/^\p{L}[\p{L}\p{M} .'-]*$/u, "City can use letters, spaces and . ' - only"),
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
