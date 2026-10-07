import type { VaccineInput } from "./vaccines";

/**
 * Prescriptions being written are copied to this browser's localStorage as the doctor types,
 * one per patient, so a refresh or a closed tab doesn't lose them. Keyed by doctor and patient:
 * a doctor can have several patients' prescriptions on the go, and a shared clinic computer
 * can have several doctors. Cleared on signing, on Discard and on signing out.
 *
 * A half-filled "Add a vaccine" form is kept the same way, under its own key, so it opens
 * filled in again next time.
 */

export type LocalRx = {
  items: string[];
  vaccines: VaccineInput[];
  /** The server draft these edits belong to, once there is one. */
  prescriptionId?: string;
  /** Whether these exact lines are also saved as a draft on the server. */
  saved: boolean;
  /** When it was last written, in ms. */
  at: number;
};

/** Every key below starts with this, so signing out can clear them all. */
const ROOT = "hm-rx";
const PREFIX = `${ROOT}:v1:`;
const VACCINE_FORM_PREFIX = `${ROOT}-vaccine-form:v1:`;
/** Older copies are dropped rather than offered back. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const keyFor = (owner: string, memberId: string) => `${PREFIX}${owner}:${memberId}`;

// Storage can be missing or throw (private mode, blocked site data, full quota): autosave
// then quietly does nothing, and the screen works as it did before.
function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function parse(raw: string | null): LocalRx | null {
  if (!raw) return null;
  try {
    const rx = JSON.parse(raw) as LocalRx;
    if (!Array.isArray(rx.items) || !Array.isArray(rx.vaccines) || typeof rx.at !== "number") return null;
    return Date.now() - rx.at > MAX_AGE_MS ? null : rx;
  } catch {
    return null;
  }
}

export function readLocalRx(owner: string, memberId: string): LocalRx | null {
  const store = storage();
  if (!store) return null;
  try {
    const key = keyFor(owner, memberId);
    const rx = parse(store.getItem(key));
    if (!rx) store.removeItem(key); // Expired or unreadable.
    return rx;
  } catch {
    return null;
  }
}

export function writeLocalRx(owner: string, memberId: string, rx: Omit<LocalRx, "at">) {
  try {
    storage()?.setItem(keyFor(owner, memberId), JSON.stringify({ ...rx, at: Date.now() }));
  } catch {
    // Quota full or storage blocked.
  }
}

export function removeLocalRx(owner: string, memberId: string) {
  try {
    storage()?.removeItem(keyFor(owner, memberId));
  } catch {
    // Storage blocked.
  }
}

/** Patients this doctor has a prescription on the go for, newest first. */
export function listLocalRx(owner: string): { memberId: string; rx: LocalRx }[] {
  const store = storage();
  if (!store) return [];
  const prefix = `${PREFIX}${owner}:`;
  const found: { memberId: string; rx: LocalRx }[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key?.startsWith(prefix)) continue;
      const rx = parse(store.getItem(key));
      if (rx) found.push({ memberId: key.slice(prefix.length), rx });
    }
  } catch {
    return [];
  }
  return found.sort((a, b) => b.rx.at - a.rx.at);
}

/** On signing out: nothing about patients stays behind in this browser. */
export function clearAllLocalRx() {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(ROOT)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // Storage blocked.
  }
}

// ---------------------------------------------------------------------------
// The "Add a vaccine" form, as typed. Its shape belongs to the dialog, which checks it on reading.

const vaccineFormKey = (owner: string, memberId: string) => `${VACCINE_FORM_PREFIX}${owner}:${memberId}`;

export function readVaccineForm(owner: string, memberId: string): unknown {
  const store = storage();
  if (!store) return null;
  try {
    const key = vaccineFormKey(owner, memberId);
    const saved = JSON.parse(store.getItem(key) ?? "null") as { form?: unknown; at?: number } | null;
    if (saved && typeof saved.at === "number" && Date.now() - saved.at <= MAX_AGE_MS) return saved.form;
    store.removeItem(key);
  } catch {
    // Unreadable or blocked.
  }
  return null;
}

export function writeVaccineForm(owner: string, memberId: string, form: unknown) {
  try {
    storage()?.setItem(vaccineFormKey(owner, memberId), JSON.stringify({ form, at: Date.now() }));
  } catch {
    // Quota full or storage blocked.
  }
}

export function removeVaccineForm(owner: string, memberId: string) {
  try {
    storage()?.removeItem(vaccineFormKey(owner, memberId));
  } catch {
    // Storage blocked.
  }
}

/** Whether two prescriptions have the same lines and vaccines. Blank lines don't count. */
export function sameRx(a: Pick<LocalRx, "items" | "vaccines">, b: Pick<LocalRx, "items" | "vaccines">) {
  const lines = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  return (
    JSON.stringify(lines(a.items)) === JSON.stringify(lines(b.items)) &&
    JSON.stringify(a.vaccines) === JSON.stringify(b.vaccines)
  );
}
