/**
 * Delivers a one-time code. This is the one place an SMS provider (MSG91, Twilio, 2Factor…)
 * plugs in. Until one is connected, the code is logged and handed back so it can be shown on
 * screen: always in development, and in production only when `OTP_SHOW_CODE=true` (test mode).
 * Otherwise production refuses rather than leak the code.
 */
export class OtpDeliveryError extends Error {}

/**
 * Whether codes are shown on screen instead of sent. In production this is test mode: anyone
 * with the URL can sign in as any number, so only switch it on for a deployment with test data.
 */
export const showOtpOnScreen = () =>
  process.env.NODE_ENV !== "production" || process.env.OTP_SHOW_CODE === "true";

/**
 * Returns the code itself when it should be shown on screen.
 * `purpose` names what the code is for, in logs and later in the SMS template.
 */
export async function sendOtp(
  phone: string,
  code: string,
  purpose: "doctor_sign_in" | "record_access" = "doctor_sign_in",
): Promise<{ devCode?: string }> {
  if (!showOtpOnScreen()) {
    throw new OtpDeliveryError(
      purpose === "doctor_sign_in"
        ? "Sign-in by SMS isn’t set up yet. Please try again later."
        : "OTPs by SMS aren’t set up yet, so a record can’t be shared. Please try again later.",
    );
  }
  console.info(`[otp] ${purpose} code for ${phone}: ${code}`);
  return { devCode: code };
}
