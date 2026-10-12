import { timingSafeEqual } from "node:crypto";

import { generateOtp, hashOtp } from "./auth";
import { cancelVerification, checkVerification, startVerification, twilioCredentials, TwilioVerifyError } from "./twilio-verify";

/**
 * Sends and checks one-time codes. With Twilio Verify set up, Twilio makes the code, texts it
 * and checks it. Without it, the code is made here and shown on screen: always in development,
 * and in production only when `OTP_SHOW_CODE=true` (test mode). Otherwise production refuses
 * rather than leak the code. `OTP_SHOW_CODE=true` also skips Twilio, to test without SMS.
 */
export class OtpDeliveryError extends Error {}

/** What a code is for. Each has its own Verify service, so the SMS says which it is. */
export type OtpPurpose = "doctor_sign_in" | "record_access";

const forcedTestMode = () => process.env.OTP_SHOW_CODE === "true";

/** The Verify service for this purpose, when Twilio is set up for it. */
function verifyService(purpose: OtpPurpose) {
  const sid = purpose === "doctor_sign_in" ? process.env.SERVICE_SID : process.env.TWILIO_RECORD_SERVICE_SID;
  return sid && twilioCredentials() ? sid : null;
}

/** The service to send through, or null when codes are made here instead. */
const sendingService = (purpose: OtpPurpose) => (forcedTestMode() ? null : verifyService(purpose));

/**
 * Whether codes are shown on screen instead of sent. In production this is test mode: anyone
 * with the URL can sign in as any number, so only switch it on for a deployment with test data.
 */
export const showOtpOnScreen = (purpose: OtpPurpose = "doctor_sign_in") =>
  !sendingService(purpose) && (process.env.NODE_ENV !== "production" || forcedTestMode());

/**
 * Indian numbers as stored (ten digits, or as typed for a nominee) in E.164, e.g. +919876543210.
 * A number already starting with + is taken as international. Null when it isn't a mobile number.
 */
export function toE164(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && !trimmed.startsWith("+91")) return /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
  const local = digits.replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

/**
 * What to keep with the challenge so the code can be checked later: its hash when it was made
 * here, Twilio's verification id when Twilio made it. `devCode` is the code to show on screen.
 */
export type SentOtp = { codeHash?: string; verificationSid?: string; devCode?: string };

/** Why Twilio refused, in words for the person at the screen. */
function sendFailure(error: unknown) {
  if (error instanceof TwilioVerifyError) {
    if (error.code === 60203) return "Too many codes were sent to this number. Wait 10 minutes and try again.";
    if (error.code === 60200 || error.code === 60205 || error.code === 21211 || error.code === 21614) {
      return "We couldn’t send an SMS to this number. Check that it is a mobile number.";
    }
  }
  return "We couldn’t send the SMS just now. Please try again in a minute.";
}

/** Sends a code to `phone`, or throws an OtpDeliveryError that says why it couldn't. */
export async function sendOtp(phone: string, purpose: OtpPurpose): Promise<SentOtp> {
  const service = sendingService(purpose);
  if (service) {
    const to = toE164(phone);
    if (!to) throw new OtpDeliveryError("This isn’t a mobile number we can send an SMS to.");
    try {
      return { verificationSid: await startVerification(service, to) };
    } catch (error) {
      console.error(`[otp] Twilio couldn't send the ${purpose} code`, error);
      throw new OtpDeliveryError(sendFailure(error));
    }
  }

  if (!showOtpOnScreen(purpose)) {
    throw new OtpDeliveryError(
      purpose === "doctor_sign_in"
        ? "Sign-in by SMS isn’t set up yet. Please try again later."
        : "OTPs by SMS aren’t set up yet, so a record can’t be shared. Please try again later.",
    );
  }
  const code = generateOtp();
  console.info(`[otp] ${purpose} code for ${phone}: ${code}`);
  return { codeHash: hashOtp(phone, code), devCode: code };
}

/** "unavailable": Twilio couldn't be reached, so the code was neither accepted nor used up. */
export type OtpCheck = "approved" | "wrong" | "expired" | "unavailable";

/** Checks `code` against what `sendOtp` returned for `phone`. */
export async function checkOtp(
  purpose: OtpPurpose,
  phone: string,
  code: string,
  sent: { codeHash?: string | null; verificationSid?: string | null },
): Promise<OtpCheck> {
  if (sent.codeHash) {
    const expected = Buffer.from(sent.codeHash, "hex");
    const actual = Buffer.from(hashOtp(phone, code), "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual) ? "approved" : "wrong";
  }

  const service = verifyService(purpose);
  if (!sent.verificationSid || !service) return "expired";
  try {
    const status = await checkVerification(service, sent.verificationSid, code);
    if (status === "approved") return "approved";
    return status === "pending" ? "wrong" : "expired";
  } catch (error) {
    if (error instanceof TwilioVerifyError && (error.status === 404 || error.code === 60202)) return "expired";
    console.error(`[otp] Twilio couldn't check the ${purpose} code`, error);
    return "unavailable";
  }
}

/** Stops a Twilio code from working, after too many wrong tries. Best effort: it expires anyway. */
export async function cancelOtp(purpose: OtpPurpose, verificationSid?: string | null) {
  const service = verifyService(purpose);
  if (!service || !verificationSid) return;
  await cancelVerification(service, verificationSid).catch((error: unknown) => {
    if (!(error instanceof TwilioVerifyError && error.status === 404)) {
      console.error(`[otp] Twilio couldn't cancel the ${purpose} code`, error);
    }
  });
}
