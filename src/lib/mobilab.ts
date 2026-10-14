import type { MobilabResults } from "./lab-results";
import type { LabCatalog } from "./lab-tests";

/**
 * Mobilab's partner API (https://api-staging.mobilab.ai/docs/), which runs the tests at the pods.
 * The member app creates the bookings (healthmatrix-app `src/server/mobilab.ts`); the console only
 * reads: a booking's status, its results, a link to its PDF report, and the catalog of tests a
 * doctor can prescribe. Server-only: the key
 * never reaches the browser. Plain `fetch`, as in `twilio-verify.ts`.
 */

const STAGING_URL = "https://api-staging.mobilab.ai";
const TIMEOUT_MS = 8_000;

/** A refusal from Mobilab, or no answer (`status` 0). `code` is Mobilab's, e.g. "booking_not_found". */
export class MobilabError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

/**
 * The API's address and key, or null when there is no key. A test key (`test_…`, made-up results)
 * is refused on the production console, so sample values can never pass for a real patient's.
 */
export function mobilabConfig() {
  const key = process.env.MOBILAB_API_KEY?.trim();
  if (!key) return null;
  if (key.startsWith("test_") && process.env.VERCEL_ENV === "production") {
    console.error("[mobilab] MOBILAB_API_KEY is a test key; it is ignored in production");
    return null;
  }
  return { url: process.env.MOBILAB_API_URL?.trim() || STAGING_URL, key };
}

export const mobilabReady = () => mobilabConfig() !== null;

/** A GET, unwrapped from Mobilab's `{ data }` envelope. With `allowMissing`, a 404 gives null. */
async function get<T>(path: string, { allowMissing = false } = {}): Promise<T | null> {
  const config = mobilabConfig();
  if (!config) throw new MobilabError("Mobilab isn’t set up", 0);

  let res: Response;
  try {
    res = await fetch(new URL(`/v1${path}`, config.url), {
      headers: { Accept: "application/json", Authorization: `Bearer ${config.key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new MobilabError(`Mobilab didn’t answer: ${String(error)}`, 0);
  }

  const body = (await res.json().catch(() => null)) as { data?: unknown; error?: { code?: string; message?: string } } | null;
  if (res.status === 404 && allowMissing) return null;
  if (!res.ok) {
    // 401: wrong or revoked key. 403: the key lacks the scope. 429: over the hourly limit.
    const error = body?.error ?? (body?.data as { code?: string; message?: string } | undefined);
    throw new MobilabError(error?.message ?? `Mobilab answered ${res.status}`, res.status, error?.code);
  }
  return (body?.data ?? null) as T | null;
}

/** A booking as Mobilab keeps it. `booking_id` is our reference, e.g. "HM-7K4QX9PA". */
export type MobilabBooking = {
  id: string;
  booking_id: string;
  /** pending, in_progress, completed, in_review, review_completed, report_generated, rejected, retest_required, archived. */
  status: string;
  is_test_mode?: boolean;
  created?: string;
  /** Last change; once the report is out, about when it was made. */
  modified?: string;
};

const ref = (bookingId: string) => encodeURIComponent(bookingId);

/** A booking by our reference, or null when Mobilab has none. */
export const findMobilabBooking = (bookingId: string) =>
  get<MobilabBooking>(`/bookings/${ref(bookingId)}`, { allowMissing: true });

/** Every reading on a booking, with units, methods and reference ranges. */
export async function getMobilabResults(bookingId: string) {
  const results = await get<MobilabResults>(`/bookings/${ref(bookingId)}/results`);
  if (!results) throw new MobilabError("Mobilab sent no results", 200);
  return results;
}

/**
 * A link to the booking's PDF report, good for about an hour, or null before it is generated.
 * Fetched each time it is opened rather than stored, since the link expires.
 */
export async function getMobilabReportUrl(bookingId: string) {
  const report = await get<{ url?: string }>(`/reports/${ref(bookingId)}`, { allowMissing: true });
  return report?.url ?? null;
}

type MobilabTest = { name: string; code: string; sample_type?: string | null };
type MobilabProfile = {
  id: number;
  /** Missing on some profiles; those are known by `profile-<id>` instead, as in the app. */
  code?: string | null;
  name: string;
  tests?: { name: string; code: string }[];
};

const PAGE = 200;

/** Every item of a Mobilab list, a page at a time. */
async function listAll<T>(path: string) {
  const items: T[] = [];
  for (;;) {
    const page = (await get<T[]>(`${path}?limit=${PAGE}&offset=${items.length}`)) ?? [];
    items.push(...page);
    if (page.length < PAGE) return items;
  }
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

async function loadCatalog(): Promise<LabCatalog> {
  const [tests, profiles] = await Promise.all([
    listAll<MobilabTest>("/lab-tests"),
    listAll<MobilabProfile>("/lab-profiles"),
  ]);
  return {
    profiles: profiles
      .map((profile) => ({
        id: profile.code?.trim() || `profile-${profile.id}`,
        name: profile.name.trim(),
        tests: (profile.tests ?? []).map((test) => ({ code: test.code, name: test.name.trim() })),
      }))
      .filter((profile) => profile.tests.length > 0)
      .sort(byName),
    tests: tests
      .map((test) => ({ code: test.code, name: test.name.trim(), sampleType: test.sample_type ?? undefined }))
      .sort(byName),
  };
}

/** The catalog rarely changes, so it is kept a while: opening the tests dialog costs no request. */
const CATALOG_KEEP_MS = 30 * 60_000;
let catalog: { data: LabCatalog; at: number } | undefined;
let loading: Promise<LabCatalog> | undefined;

/** The tests and health checks the pods can run, by name. */
export async function labCatalog(): Promise<LabCatalog> {
  if (catalog && Date.now() - catalog.at < CATALOG_KEEP_MS) return catalog.data;
  loading ??= loadCatalog()
    .then((data) => {
      catalog = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      loading = undefined;
    });
  return loading;
}
