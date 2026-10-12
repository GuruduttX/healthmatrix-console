/**
 * Twilio Verify over its REST API (https://www.twilio.com/docs/verify/api). Twilio makes the
 * code, texts it and checks it; we only keep the verification's id. Server-only: it uses the
 * account's auth token. Plain `fetch` rather than the `twilio` package, so the same calls can
 * be copied to healthmatrix-app, which runs on EAS Hosting.
 */

const API = "https://verify.twilio.com/v2/Services";
const TIMEOUT_MS = 10_000;

/** A refusal from Twilio. `code` is Twilio's error code, e.g. 60203 for too many sends. */
export class TwilioVerifyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

/** The account keys, or null when they aren't in the environment. */
export function twilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  return accountSid && authToken ? { accountSid, authToken } : null;
}

async function post(path: string, params: Record<string, string>) {
  const credentials = twilioCredentials();
  if (!credentials) throw new TwilioVerifyError("Twilio keys are missing", 0);
  const { accountSid, authToken } = credentials;

  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string; code?: number; sid?: string; status?: string };
  if (!res.ok) throw new TwilioVerifyError(body.message ?? `Twilio Verify answered ${res.status}`, res.status, body.code);
  return body;
}

/** Texts a new code to `to` (E.164, e.g. +919876543210). Returns the verification's id (VE…). */
export async function startVerification(serviceSid: string, to: string) {
  const { sid } = await post(`${serviceSid}/Verifications`, { To: to, Channel: "sms" });
  if (!sid) throw new TwilioVerifyError("Twilio Verify sent no verification id", 200);
  return sid;
}

/**
 * Checks a code against a verification. Returns Twilio's status: "approved" when it matches,
 * "pending" when it doesn't. Throws a 404 once the verification is gone (expired, already
 * approved or cancelled), and code 60202 after too many wrong codes.
 */
export async function checkVerification(serviceSid: string, verificationSid: string, code: string) {
  const { status } = await post(`${serviceSid}/VerificationCheck`, { VerificationSid: verificationSid, Code: code });
  return status;
}

/** Cancels a pending verification so its code stops working. */
export async function cancelVerification(serviceSid: string, verificationSid: string) {
  await post(`${serviceSid}/Verifications/${verificationSid}`, { Status: "canceled" });
}
