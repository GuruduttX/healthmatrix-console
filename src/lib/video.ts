import { createHmac } from "node:crypto";

/**
 * Twilio Video for consults, over its REST API (https://www.twilio.com/docs/video/api). One
 * two-person group room per consult, opened by whichever side gets there first: the doctor
 * opening the consult here, or the member joining from healthmatrix-app, which opens rooms the
 * same way. Both join without camera or mic; the member in the room is the waiting room, and
 * the doctor publishing camera or mic is what admits them (see `consult-stage.tsx`).
 * Server-only: it signs with the API key secret. Only access tokens go to the browser.
 *
 * Shared with the app, so don't change: room `consult-<consultId>`, identities
 * `doctor-<doctorId>` and `member-<memberId>`, and the room settings in `ensureRoom`.
 */

const API = "https://video.twilio.com/v1/Rooms";
const TIMEOUT_MS = 10_000;
/** How long a doctor's access token lets them join the room. */
const TOKEN_TTL_S = 4 * 60 * 60;

/** A refusal from Twilio. `code` is Twilio's error code. */
export class TwilioVideoError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

/** The account and API key, or null when any of them isn't in the environment. */
function videoCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  return accountSid && apiKeySid && apiKeySecret ? { accountSid, apiKeySid, apiKeySecret } : null;
}

/** Whether video calls are set up on this deployment. */
export const videoReady = () => videoCredentials() !== null;

export const roomNameFor = (consultId: string) => `consult-${consultId}`;
export const doctorIdentity = (doctorId: string) => `doctor-${doctorId}`;

type RoomBody = {
  sid?: string;
  unique_name?: string;
  status?: string;
  message?: string;
  code?: number;
  participants?: { identity: string }[];
};

async function request(method: "GET" | "POST", path: string, params?: Record<string, string>, timeoutMs = TIMEOUT_MS) {
  const credentials = videoCredentials();
  if (!credentials) throw new TwilioVideoError("Twilio Video keys are missing", 0);
  const { apiKeySid, apiKeySecret } = credentials;

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64")}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = (await res.json().catch(() => ({}))) as RoomBody;
  if (!res.ok) throw new TwilioVideoError(body.message ?? `Twilio Video answered ${res.status}`, res.status, body.code);
  return body;
}

/** The room while it is in progress. A lookup by name never finds a completed room. */
const findRoom = (name: string) => request("GET", `/${encodeURIComponent(name)}`).catch(() => null);

/**
 * Opens the consult's room, or returns it when it is already open. Either side may get here
 * first, or both at once: when the create fails, the other side may have just made it.
 */
export async function ensureRoom(consultId: string) {
  const name = roomNameFor(consultId);
  const open = await findRoom(name);
  if (open) return open;
  try {
    return await request("POST", "", {
      UniqueName: name,
      Type: "group",
      MaxParticipants: "2",
      MediaRegion: "in1",
      EmptyRoomTimeout: "10",
      UnusedRoomTimeout: "10",
    });
  } catch (error) {
    const raced = await findRoom(name);
    if (raced) return raced;
    throw error;
  }
}

/** Closes the consult's room, which disconnects everyone in it. Already closed is fine. */
export async function completeRoom(consultId: string) {
  try {
    await request("POST", `/${encodeURIComponent(roomNameFor(consultId))}`, { Status: "completed" });
  } catch (error) {
    if (!(error instanceof TwilioVideoError && error.status === 404)) throw error;
  }
}

/**
 * Whether the member is connected to the consult's room. Before the doctor admits them, that
 * means they are in the app's waiting room. For the Today and Schedule lists, so it gives up fast.
 */
export async function patientInRoom(consultId: string) {
  try {
    const { participants = [] } = await request(
      "GET",
      `/${encodeURIComponent(roomNameFor(consultId))}/Participants?Status=connected`,
      undefined,
      3000,
    );
    return participants.some((p) => p.identity.startsWith("member-"));
  } catch (error) {
    if (error instanceof TwilioVideoError && error.status === 404) return false;
    throw error;
  }
}

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * A Twilio access token that lets `identity` into `roomName`, signed as the `twilio` package
 * does (https://www.twilio.com/docs/iam/access-tokens).
 */
export function videoToken(identity: string, roomName: string) {
  const credentials = videoCredentials();
  if (!credentials) throw new TwilioVideoError("Twilio Video keys are missing", 0);
  const { accountSid, apiKeySid, apiKeySecret } = credentials;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" });
  const payload = base64url({
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    sub: accountSid,
    iat: now,
    exp: now + TOKEN_TTL_S,
    grants: { identity, video: { room: roomName } },
  });
  const signature = createHmac("sha256", apiKeySecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}
