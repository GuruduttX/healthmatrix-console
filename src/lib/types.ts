/** Domain types for the doctor console. Mirrors the models in `healthmatrix-app/server`. */

export type PlanId = "essential" | "plus" | "family" | "senior_care" | "community";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

/** Layer-2 access: `none` means the doctor has never asked for this patient's record. */
export type AccessStatus = "active" | "pending" | "expired" | "none";

export type ResultFlag = "normal" | "borderline" | "high" | "low" | "pending";

export type Tone = "success" | "warning" | "danger" | "brand" | "neutral";

export type AvatarTone = "brand" | "ink" | "success" | "rust";

export type Doctor = {
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
};

export type Patient = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  avatarTone: AvatarTone;
  age: number;
  sex: "female" | "male";
  bloodGroup: BloodGroup;
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
  patientId: string;
  /** Left out for today's consults. */
  day?: string;
  time: string;
  mode: "Video" | "Video from pod";
  reason: string;
  status: ConsultStatus;
};

export type TimelineEntry = {
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
  explains?: string;
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

export type RecordAnswer = { question: string; answer: string; source?: string };

export type PatientRecord = {
  summary: string[];
  medicines: string[];
  timeline: TimelineEntry[];
  charts: ChartSpec[];
  results: LabResult[];
  qa: RecordAnswer[];
  prescriptionDraft: string[];
  draftSource: string;
};

export type EkaayFlag = { patientId: string; text: string; tone: Tone };

export type AccessLogEntry = {
  at: string;
  patientId: string;
  what: string;
  approvedBy: string;
  status: AccessStatus;
};

export type Prescription = {
  id: string;
  patientId: string;
  date: string;
  status: "draft" | "signed";
  source: string;
  items: string[];
};

export type TestOrderStatus = "awaiting_booking" | "booked" | "result_back" | "reviewed";

export type TestOrder = {
  id: string;
  patientId: string;
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
