/** Holds the session token. Its hash is in `doctorsessions`; see `src/lib/auth.ts`. */
export const SESSION_COOKIE = "hm_doctor_session";

/** The phone a code was just sent to, so it stays out of the URL. */
export const OTP_PHONE_COOKIE = "hm_otp_phone";

/** The code itself, outside production only, while no SMS provider is connected. */
export const DEV_OTP_COOKIE = "hm_otp_dev";
