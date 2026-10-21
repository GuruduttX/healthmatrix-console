/** Domain types for the doctor console. Mirrors the models in `healthmatrix-app/server`. */

import type { LabTestInput } from "./lab-tests";
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
  /** ISO start and end of the slot, for counting down to it. */
  startsAt: string;
  endsAt: string;
  mode: "Video" | "Video from pod";
  reason: string;
  status: ConsultStatus;
  /** ISO time the call started, while it is in progress. */
  startedAt?: string;
  /** The patient is in the consult's video room, waiting to be admitted. Today and Schedule only. */
  patientWaiting?: boolean;
};

/** A patient asking for a consult at a time that isn't one of the open slots. Pending, not expired. */
export type ConsultRequest = {
  id: string;
  patient: Patient;
  /** "38, female" when known. */
  about?: string;
  /** "Today, 3:25 pm" or "Wed 14 Oct, 3:25 pm". */
  when: string;
  /** "in 2 h", only when the time asked for is today. */
  inHowLong?: string;
  reason?: string;
  /** "12 min ago" */
  askedAgo: string;
  /** Why the time may not suit the doctor: outside their hours, or a clash with a booking. */
  warning?: string;
  /** Not attended: the time passed with no reply. It can't be answered any more. */
  missed?: boolean;
};

export type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  type: "pod_screening" | "lab_report" | "prescription" | "vaccination" | "note";
  /** What it holds at a glance: a prescription's first lines, "Metformin 500 mg, HbA1c test + 2 more". */
  preview?: string;
};

export type DetailValue = {
  name: string;
  value: string;
  range?: string;
  flag: ResultFlag;
  label: string;
  /** Where the value sits on its range bar, from 0 to 1. */
  position?: number;
  /** The health check it was booked under, e.g. "Lipid Profile". */
  group?: string;
};

export type RecordDetail = {
  source: string;
  values?: DetailValue[];
  items?: string[];
  vaccines?: VaccineView[];
  explains?: string;
  /** How many attached pages or files there are. */
  files: number;
  /** The pathologist's remarks on a pod screening. */
  remarks?: string;
  /** Made-up values from Mobilab's test mode, never a real reading. */
  isSample?: boolean;
  /** Booked test codes the lab sent no usable value for, e.g. "ABO-Type". */
  missing?: string[];
  /** A pod screening's PDF report can be opened from Mobilab. */
  report?: boolean;
  /** A prescription's lab tests, "Liver Function Test, 5 tests". */
  tests?: string[];
};

/** A pod booking the member made in the app, as the doctor sees it. */
export type LabBooking = {
  id: string;
  /** Our reference, "HM-7K4QX9PA"; the member reads it out at the pod. */
  reference: string;
  /** "Lipid Profile, Diabetic Profile" or "3 tests". */
  title: string;
  /** "9 tests at Doomsday Clinic, booked 14 Oct 2026" */
  subtitle: string;
  stage: { label: string; tone: Tone };
  /** Why the report isn't there yet, or that the lab couldn't be reached. */
  note?: string;
  /** The pod screening record once results are filed: the values and the PDF open from it. */
  recordId?: string;
  isSample: boolean;
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
export type DraftRef = { id: string; items: string[]; vaccines: VaccineInput[]; tests: LabTestInput[] };

export type PatientRecord = {
  /** Ekaay's summary lines from a consult, empty when none has one (`EkaaySummary` then writes one from the record). */
  summary: string[];
  medicines: string[];
  /** The prescriptions given to the patient, newest first. Lab results live on the lab tests card. */
  timeline: TimelineEntry[];
  charts: ChartSpec[];
  /** Pod bookings, newest first; `labConnected` is false when Mobilab isn't set up. */
  labBookings: LabBooking[];
  labConnected: boolean;
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
  /** Lab tests picked from Mobilab's catalog. */
  tests: LabTestInput[];
  date: string;
  status: "draft" | "signed";
  source: string;
  items: string[];
};

export type TestOrderStatus = "awaiting_booking" | "booked" | "result_back" | "reviewed" | "cancelled";

/** A row on Results: a pod booking by one of the doctor's patients, or tests they ordered that aren't booked yet. */
export type TestOrder = {
  id: string;
  patient: PatientRef;
  /** "Liver Function Test", "HbA1c, TSH" or "3 tests". */
  test: string;
  /** When the doctor ordered it; unset for tests the patient booked without their order. */
  orderedOn?: string;
  where: string;
  status: TestOrderStatus;
  /** Where a booking still waiting for results is at the lab: "Not tested yet", "Testing", … */
  progress?: string;
  result?: { value: string; flag: ResultFlag; label: string; date: string };
  /** Results from Mobilab's test mode: made-up values, never a real reading. */
  isSample?: boolean;
};

export type Notification = {
  id: string;
  time: string;
  title: string;
  body: string;
  href: string;
  tone: Tone;
  /** When it happened, as an ISO string: newer than when the doctor last opened Notifications is new. */
  at: string;
};
