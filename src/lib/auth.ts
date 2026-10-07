import { createHash, randomBytes, randomInt } from "node:crypto";

import type { Types } from "mongoose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { connectDB } from "./db";
import { SESSION_COOKIE } from "./session";
import { DoctorModel, DoctorSessionModel, type Doctor } from "@/models";

/**
 * Doctor sign-in: a one-time code to the phone, then a session cookie. Mirrors
 * `healthmatrix-app/src/server/auth.ts`, but keeps its own collections and uses a
 * cookie instead of a bearer token.
 */

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
/** How long before the same phone can ask for another code. */
export const OTP_RESEND_MS = 30 * 1000;

/** Shorter than the app's 90 days: the console opens patient records. */
const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
/** Time to finish onboarding after verifying the phone. */
const ONBOARDING_TTL_MS = 30 * 60 * 1000;

/** Indian mobile number, ten digits starting 6 to 9. Stored without +91, as in the app. */
export const PHONE_PATTERN = /^[6-9]\d{9}$/;

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** The OTP hash is salted with the phone so the same code on two phones hashes differently. */
export const hashOtp = (phone: string, code: string) => sha256(`${phone}:${code}`);

type DoctorDoc = Doctor & { _id: Types.ObjectId };

/** Everything onboarding asks for. Photo, qualifications and council can come later. */
export function isProfileComplete(doctor: DoctorDoc) {
  return Boolean(
    doctor.name?.trim() &&
      doctor.registrationNumber?.trim() &&
      doctor.specialties?.length &&
      doctor.languages?.length &&
      doctor.state &&
      doctor.city?.trim() &&
      doctor.telemedicineConsentAt,
  );
}

const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(maxAgeMs / 1000),
});

/**
 * Starts a session for a verified phone and sets the cookie. Without a doctor it is an
 * onboarding session, good only for finishing the profile. Server Functions only.
 */
export async function createSession(phone: string, doctorId?: Types.ObjectId) {
  const ttl = doctorId ? SESSION_TTL_MS : ONBOARDING_TTL_MS;
  const token = randomBytes(32).toString("base64url");
  await DoctorSessionModel.create({
    tokenHash: sha256(token),
    phone,
    doctor: doctorId,
    expiresAt: new Date(Date.now() + ttl),
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(ttl));
}

/** Attaches a doctor to an onboarding session and extends it to a full session. */
export async function upgradeSession(sessionId: Types.ObjectId, doctorId: Types.ObjectId) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  await DoctorSessionModel.updateOne(
    { _id: sessionId },
    { doctor: doctorId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  );
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_MS));
}

/** The session behind this request's cookie and its doctor, if any. Once per request. */
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDB();
  const session = await DoctorSessionModel.findOne({
    tokenHash: sha256(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const doctor = session.doctor
    ? await DoctorModel.findById(session.doctor).lean<DoctorDoc>()
    : null;
  return { session, doctor };
});

/**
 * The signed-in doctor, for console pages and actions. Sends everyone else to sign in,
 * or to onboarding if the profile isn't finished.
 */
export async function requireDoctor() {
  const current = await getSession();
  if (!current) redirect("/login?expired=1");
  const { session, doctor } = current;
  if (session.doctor && (!doctor || !doctor.isActive)) redirect("/login?expired=1");
  if (!doctor || !isProfileComplete(doctor)) redirect("/onboarding");
  return doctor;
}

/** Ends this browser's session. Server Functions only. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await connectDB();
    await DoctorSessionModel.deleteOne({ tokenHash: sha256(token) });
  }
  cookieStore.delete(SESSION_COOKIE);
}
