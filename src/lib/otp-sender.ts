/**
 * Delivers a sign-in code. This is the one place an SMS provider (MSG91, Twilio, 2Factor…)
 * plugs in. Until one is connected, the code is logged and handed back outside production
 * so sign-in can be tested; in production sign-in is refused rather than leak the code.
 */
export class OtpDeliveryError extends Error {}

/** Returns the code itself when it should be shown on screen (development only). */
export async function sendOtp(phone: string, code: string): Promise<{ devCode?: string }> {
  if (process.env.NODE_ENV === "production") {
    throw new OtpDeliveryError("Sign-in by SMS isn’t set up yet. Please try again later.");
  }
  console.info(`[auth] Doctor OTP for ${phone}: ${code}`);
  return { devCode: code };
}
