/** Domain types for the doctor console. Mirrors the models in `healthmatrix-app/server`. */

import type { VaccineInput } from "./vaccines";

export type PlanId = "essential" | "plus" | "family" | "senior_care" | "community";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

/**
 * Layer-2 access: `none` means there is no live request for this patient's record,
 * `revoked` that the patient closed it early.
 */
export type AccessStatus = "active" | "pending" | "expired" | "revoked" | "none";

export type ResultFlag = "normal" | "borderline" | "high" | "low" | "pending";

export type Tone = "success" | "warning" | "danger" | "brand" | "neutral";

export type AvatarTone = "brand" | "ink" | "success" | "rust";

export type Doctor = {
  /** The doctor's id, for keeping their drafts apart in a shared browser. */
  id: string;
  name: string;
  shortName: string;
  initials: string;
  qualifications: string;
  specialty: string;
  phone: string;
  registrationNumber: string;
  council: string;
  specialties: string[];
  languages: string[];
  /** "New Delhi, Delhi" */
  location: string;
  /** Cloudinary WebP, when the doctor has added one. */
  photoUrl?: string;
  about: string;
  experienceYears?: number;
  /** What Edit profile still asks for, in the order it shows them. */
  missing: ProfileGap[];
};

export type ProfileGap = "photo" | "qualifications" | "council" | "experience" | "about";

/** Just enough to show who a row is about. */
export type PatientRef = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  avatarTone: AvatarTone;
};

export type Patient = PatientRef & {
  /** Left out when the member hasn't given a date of birth, and so on. */
  age?: number;
  sex?: "female" | "male" | "other";
  bloodGroup?: BloodGroup;
  /** "HM 4829 1057 3316" */
  memberId: string;
  plan: PlanId;
  abhaLinked: boolean;
  allergies: string[];
  conditions: string[];
  access: { status: AccessStatus; note: string };
};

/** The person a patient picked to receive OTPs when they can't respond. */
export type Nominee = { name: string; relation: string };

export type ConsultStatus = "scheduled" | "in_progress" | "completed";

export type Consult = {
  id: string;
  patient: Patient;
  /** "Today", "Tomorrow" or "Mon 12 Oct". */
  day: string;
  time: string;
  mode: "Video" | "Video from pod";
  reason: string;
  status: ConsultStatus;
  /** ISO time the call started, while it is in progress. */
  startedAt?: string;
};

export type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  type: "pod_screening" | "lab_report" | "prescription" | "vaccination" | "note";
};

export type DetailValue = {
  name: string;
  value: string;
  range?: string;
  flag: ResultFlag;
  label: string;
  /** Where the value sits on its range bar, from 0 to 1. */
  position?: number;
};

export type RecordDetail = {
  source: string;
  values?: DetailValue[];
  items?: string[];
  vaccines?: VaccineView[];
  explains?: string;
  /** How many attached pages or files there are. */
  files: number;
};

export type ChartBand = { from: number; to: number; tone: "success" | "warning"; label: string };

export type ChartSpec = {
  title: string;
  unit: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  bands?: ChartBand[];
  /** Reference values drawn as gridlines, e.g. 120 and 80 for blood pressure. */
  refLines?: number[];
  caption?: string;
};

export type LabResult = { name: string; value: string; flag: ResultFlag; label: string };

export type DoseStatus = "given" | "due" | "overdue" | "cancelled";

/** A prescribed vaccine as the console shows it. */
export type VaccineView = {
  id: string;
  name: string;
  brand?: string;
  /** "0.5 mL, intramuscular, left upper arm" */
  doseText: string;
  /** "3 doses, every 1 month" */
  scheduleText: string;
  instructions?: string;
  doses: { number: number; total: number; dueOn: string; status: DoseStatus; givenOn?: string }[];
};

/** The draft this doctor is working on for a patient, if any, with its vaccines as the dialog edits them. */
export type DraftRef = { id: string; items: string[]; vaccines: VaccineInput[] };

export type PatientRecord = {
  /** Ekaay's summary lines, empty until Ekaay has written one. */
  summary: string[];
  medicines: string[];
  timeline: TimelineEntry[];
  charts: ChartSpec[];
  results: LabResult[];
  draft: DraftRef | null;
};

/** A reading outside its range, from a record the doctor can open. */
export type AttentionFlag = { patient: PatientRef; text: string; tone: Tone };

export type AccessLogEntry = {
  id: string;
  at: string;
  patient: PatientRef;
  what: string;
  approvedBy: string;
  status: AccessStatus;
};

export type Prescription = {
  id: string;
  patient: Patient;
  /** Vaccines on it, shown as "+1 vaccine" in lists. */
  vaccineCount: number;
  date: string;
  status: "draft" | "signed";
  source: string;
  items: string[];
};

export type TestOrderStatus = "awaiting_booking" | "booked" | "result_back" | "reviewed";

export type TestOrder = {
  id: string;
  patient: PatientRef;
  test: string;
  orderedOn: string;
  where: string;
  status: TestOrderStatus;
  result?: { value: string; flag: ResultFlag; label: string; date: string };
};

export type Notification = {
  id: string;
  time: string;
  title: string;
  body: string;
  href: string;
  tone: Tone;
  unread: boolean;
};
