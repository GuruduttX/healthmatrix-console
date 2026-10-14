import { isValidObjectId, Types } from "mongoose";
import { cache } from "react";

import {
  AccessGrantModel,
  AccessLogModel,
  BookingModel,
  ConsultModel,
  ConsultRequestModel,
  EMERGENCY_FIELDS,
  EmergencyProfileModel,
  HealthRecordModel,
  MemberModel,
  PrescriptionModel,
  ReminderModel,
  TestOrderModel,
  VaccinationModel,
  type AccessGrant,
  type Booking,
  type Doctor,
  type EmergencyProfile,
  type HealthRecord,
  type Member,
  type Vaccination,
} from "@/models";

import { requireDoctor } from "./auth";
import { connectDB } from "./db";
import {
  dayLabel,
  formatDate,
  formatMonth,
  formatShortDate,
  formatShortWhen,
  formatTime,
  formatWhen,
  istDayStart,
  timeAgo,
  timeLeft,
} from "./format";
import { missingTests } from "./lab-results";
import { describeLabTest, type LabTestInput } from "./lab-tests";
import { getMobilabReportUrl, mobilabReady } from "./mobilab";
import { ageAndSex, allergyTerms } from "./patient-text";
import { stageOf, syncMemberBookings } from "./pod-bookings";
import {
  consultBusy,
  consultFits,
  istDateKey,
  istInstant,
  resolveSchedule,
  slotDays,
  type SavedSchedule,
  type Schedule,
  type Session,
} from "./schedule";
import { patientInRoom, videoReady } from "./video";
import { dateToDay, describeDose, describeSchedule, formatDay, todayInIndia, type VaccineInput } from "./vaccines";
import type {
  AccessLogEntry,
  AccessStatus,
  AttentionFlag,
  AvatarTone,
  BloodGroup,
  ChartSpec,
  Consult,
  ConsultRequest,
  DetailValue,
  LabBooking,
  Nominee,
  Notification,
  Patient,
  PatientRecord,
  PatientRef,
  PlanId,
  Prescription,
  RecordDetail,
  ResultFlag,
  TestOrder,
  TestOrderStatus,
  TimelineEntry,
  Tone,
  VaccineView,
  DraftRef,
  DoseStatus,
} from "./types";

/**
 * Everything the console screens read, scoped to the signed-in doctor. Server code only.
 *
 * Privacy rule: before a patient shares their record by OTP, a doctor sees only what the
 * patient's public emergency view shows (name, and the alerts they chose to make visible).
 * Medicines, history and results are read only while an access grant is active.
 */

type Id = Types.ObjectId;
type Doc<T> = T & { _id: Id; createdAt: Date; updatedAt: Date };
type MemberDoc = Doc<Member>;
type ProfileDoc = Doc<EmergencyProfile>;
type GrantDoc = Doc<AccessGrant>;
type RecordDoc = Doc<HealthRecord>;
type BookingDoc = Doc<Booking>;

/** How long a patient's OTP keeps the record open. */
export const ACCESS_TTL_MS = 24 * 60 * 60 * 1000;
/** How long an access OTP can be used. */
export const ACCESS_OTP_TTL_MS = 10 * 60 * 1000;

const asId = (id: string) => (isValidObjectId(id) ? new Types.ObjectId(id) : null);

async function currentDoctorId() {
  const doctor = await requireDoctor();
  await connectDB();
  return doctor._id;
}

// ---------------------------------------------------------------------------
// Patients

const AVATAR_TONES: AvatarTone[] = ["brand", "ink", "success", "rust"];

function avatarTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function ageOn(dateOfBirth: Date, today = new Date()) {
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const birthdayPassed =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  return birthdayPassed ? age : age - 1;
}

/** "482910573316" → "HM 4829 1057 3316" */
export const formatMemberId = (id: string) => `HM ${id.slice(0, 4)} ${id.slice(4, 8)} ${id.slice(8)}`;

const clean = (items: (string | null | undefined)[] | null | undefined) =>
  (items ?? []).map((item) => item?.trim() ?? "").filter(Boolean);

function toRef(member: Pick<MemberDoc, "_id" | "name">): PatientRef {
  const id = String(member._id);
  return {
    id,
    name: member.name,
    firstName: member.name.trim().split(/\s+/)[0],
    initials: initialsOf(member.name),
    avatarTone: avatarTone(id),
  };
}

/** The nominee who can approve access when the patient can't, from their emergency contacts. */
function nomineeContact(profile: ProfileDoc | null | undefined) {
  return profile?.emergencyContacts?.find((contact) => contact.isNominee && contact.phone?.trim());
}

function nomineeOf(profile: ProfileDoc | null | undefined): Nominee | undefined {
  const contact = nomineeContact(profile);
  return contact ? { name: contact.name, relation: contact.relation?.trim() || "nominee" } : undefined;
}

/** Who an OTP went to, worded for notes: "Priya" or "nominee Vikram". */
function recipientOf(phone: string | null | undefined, member: MemberDoc, profile?: ProfileDoc | null) {
  const first = member.name.trim().split(/\s+/)[0];
  if (!phone || phone === member.phone) return { role: "patient" as const, name: member.name, label: first };
  const contact = profile?.emergencyContacts?.find((c) => c.phone === phone);
  const name = contact?.name ?? "their nominee";
  return { role: "nominee" as const, name, label: `nominee ${name.split(/\s+/)[0]}` };
}

type Access = { status: AccessStatus; note: string; grant?: GrantDoc };

/** What the latest grant between this doctor and member means right now. */
function accessOf(
  grant: GrantDoc | undefined,
  member: MemberDoc,
  profile: ProfileDoc | null | undefined,
  now = new Date(),
): Access {
  if (!grant) return { status: "none", note: "Not requested yet" };
  const who = recipientOf(grant.otpSentTo, member, profile).label;
  const expiresAt = grant.expiresAt ?? undefined;

  if (grant.status === "revoked") {
    const when = grant.revokedAt ? ` ${formatWhen(grant.revokedAt, now)}` : "";
    return { status: "revoked", note: `${toRef(member).firstName} closed access${when}`, grant };
  }
  if (grant.status === "active" && expiresAt && expiresAt > now) {
    const opened = grant.approvedAt ? ` at ${formatTime(grant.approvedAt)}` : "";
    return { status: "active", note: `Opened with ${who}’s OTP${opened}, expires ${timeLeft(expiresAt, now)}`, grant };
  }
  if (grant.status === "pending" && expiresAt && expiresAt > now) {
    return { status: "pending", note: `OTP sent to ${who} at ${formatTime(grant.updatedAt)}, waiting for it to be shared`, grant };
  }
  if (grant.status === "pending") {
    return { status: "none", note: `The OTP sent ${formatWhen(grant.updatedAt, now)} wasn’t shared`, grant };
  }
  return { status: "expired", note: `Access expired ${expiresAt ? formatWhen(expiresAt, now) : ""}`.trim(), grant };
}

function toPatient(member: MemberDoc, profile: ProfileDoc | null | undefined, access: Access): Patient {
  // With the record open the doctor sees everything; before that, only what the member made public.
  const visible = new Set<string>(profile?.visibleFields ?? EMERGENCY_FIELDS);
  const shows = (field: (typeof EMERGENCY_FIELDS)[number]) => access.status === "active" || visible.has(field);

  return {
    ...toRef(member),
    age: member.dateOfBirth ? ageOn(member.dateOfBirth) : undefined,
    sex: member.gender ?? undefined,
    bloodGroup: shows("bloodGroup") ? ((member.bloodGroup as BloodGroup | null) ?? undefined) : undefined,
    memberId: formatMemberId(member.memberId),
    plan: (member.plan ?? "essential") as PlanId,
    abhaLinked: Boolean(member.abha?.number || member.abha?.address),
    allergies: shows("allergies") ? clean(profile?.allergies) : [],
    conditions: shows("conditions") ? clean(profile?.conditions) : [],
    access: { status: access.status, note: access.note },
  };
}

const MEMBER_FIELDS = "memberId phone name dateOfBirth gender bloodGroup abha plan";

/** Patients by member id, each with this doctor's access to them. */
async function loadPatients(doctorId: Id, memberIds: Id[]) {
  const unique = [...new Map(memberIds.map((id) => [String(id), id])).values()];
  const [members, profiles, grants] = await Promise.all([
    MemberModel.find({ _id: { $in: unique } }).select(MEMBER_FIELDS).lean<MemberDoc[]>(),
    EmergencyProfileModel.find({ member: { $in: unique } }).lean<ProfileDoc[]>(),
    AccessGrantModel.find({ doctor: doctorId, member: { $in: unique } })
      .sort({ createdAt: -1 })
      .select("-otpHash -verificationSid")
      .lean<GrantDoc[]>(),
  ]);

  const profileOf = new Map(profiles.map((p) => [String(p.member), p]));
  const latestGrant = new Map<string, GrantDoc>();
  for (const grant of grants) if (!latestGrant.has(String(grant.member))) latestGrant.set(String(grant.member), grant);

  const now = new Date();
  const result = new Map<string, { patient: Patient; member: MemberDoc; profile?: ProfileDoc; access: Access }>();
  for (const member of members) {
    const key = String(member._id);
    const profile = profileOf.get(key);
    const access = accessOf(latestGrant.get(key), member, profile, now);
    result.set(key, { patient: toPatient(member, profile, access), member, profile, access });
  }
  return result;
}

/** Everyone this doctor has a consult, access request, prescription or test order with. */
async function linkedMemberIds(doctorId: Id) {
  const lists = await Promise.all([
    ConsultModel.distinct("member", { doctor: doctorId }),
    AccessGrantModel.distinct("member", { doctor: doctorId }),
    PrescriptionModel.distinct("member", { doctor: doctorId }),
    TestOrderModel.distinct("member", { doctor: doctorId }),
  ]);
  return lists.flat() as Id[];
}

type TodayConsult = { id: string; time: string; status: Consult["status"] };

async function todaysConsultsByMember(doctorId: Id) {
  const consults = await ConsultModel.find({
    doctor: doctorId,
    status: { $ne: "cancelled" },
    scheduledAt: { $gte: istDayStart(), $lt: istDayStart(new Date(), 1) },
  })
    .sort({ scheduledAt: 1 })
    .lean();
  const byMember = new Map<string, TodayConsult>();
  for (const c of consults) {
    const key = String(c.member);
    // Prefer the consult still to come over one already done.
    const existing = byMember.get(key);
    if (!existing || existing.status === "completed") {
      byMember.set(key, { id: String(c._id), time: formatTime(c.scheduledAt), status: c.status as Consult["status"] });
    }
  }
  return byMember;
}

/** A typed member ID: "HM 4829 1057 3316", "482910573316". */
const MEMBER_ID_QUERY = /^(?:hm)?\d{12}$/i;

export type PatientListItem = { patient: Patient; todayConsult?: TodayConsult };

/**
 * The doctor's patients, filtered by name or member ID. A full member ID also finds a member
 * the doctor has never seen, so they can ask for access; a name never searches beyond their own.
 */
export async function getPatients({ q = "", access = "all" }: { q?: string; access?: string }) {
  const doctorId = await currentDoctorId();
  const needle = q.toLowerCase().replace(/\s+/g, "");

  const ids = await linkedMemberIds(doctorId);
  if (MEMBER_ID_QUERY.test(needle)) {
    const found = await MemberModel.findOne({ memberId: needle.replace(/^hm/, "") }).select("_id").lean();
    if (found) ids.push(found._id);
  }

  const [patients, today] = await Promise.all([loadPatients(doctorId, ids), todaysConsultsByMember(doctorId)]);
  return [...patients.values()]
    .map(({ patient }): PatientListItem => ({ patient, todayConsult: today.get(patient.id) }))
    .filter(({ patient }) => {
      const haystack = `${patient.name}${patient.memberId}`.toLowerCase().replace(/\s+/g, "");
      return (access === "all" || patient.access.status === access) && haystack.includes(needle);
    })
    .sort((a, b) => Number(Boolean(b.todayConsult)) - Number(Boolean(a.todayConsult)) || a.patient.name.localeCompare(b.patient.name));
}

/** One patient for the header and access gate. Any member can be looked up by their id. */
export const getPatient = cache(async (id: string) => {
  const memberId = asId(id);
  if (!memberId) return null;
  const doctorId = await currentDoctorId();
  const [found, today] = await Promise.all([loadPatients(doctorId, [memberId]), todaysConsultsByMember(doctorId)]);
  const entry = found.get(id);
  if (!entry) return null;
  return {
    patient: entry.patient,
    nominee: nomineeOf(entry.profile),
    todayConsult: today.get(id),
    allergyTerms: allergyTerms(clean(entry.profile?.allergies)),
    medicines: entry.access.status === "active" ? clean(entry.profile?.medicines) : [],
    grantId: entry.access.grant?._id,
  };
});

/**
 * Opening the same thing again within this long counts as the same view. Screens re-read
 * themselves every 30 seconds (`LiveUpdates`), which must not flood the patient's log.
 */
const VIEW_REPEAT_MS = 10 * 60 * 1000;

/** Notes a view on the active grant, so the patient can see what was opened and when. */
async function logView(grantId: Id | undefined, what: string) {
  if (!grantId) return;
  const since = new Date(Date.now() - VIEW_REPEAT_MS);
  await AccessGrantModel.updateOne(
    { _id: grantId, status: "active", views: { $not: { $elemMatch: { what, at: { $gte: since } } } } },
    { $push: { views: { at: new Date(), what } } },
  );
}

// ---------------------------------------------------------------------------
// Records

const FLAG_LABELS: Record<string, string> = {
  normal: "Normal",
  watch: "Watch",
  borderline: "Borderline",
  high: "High",
  low: "Low",
};

type RecordValue = NonNullable<RecordDoc["values"]>[number];

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

const valueText = (v: RecordValue) => [formatNumber(v.value), v.unit].filter(Boolean).join(" ");

/** The stored flag, or one worked out from the range; "pending" when there is neither. */
function flagOf(v: RecordValue): { flag: ResultFlag; label: string } {
  const range = v.referenceRange;
  const stored = v.flag;
  if (stored) return { flag: stored === "watch" ? "borderline" : (stored as ResultFlag), label: FLAG_LABELS[stored] };
  if (typeof range?.high === "number" && v.value > range.high) return { flag: "high", label: "High" };
  if (typeof range?.low === "number" && v.value < range.low) return { flag: "low", label: "Low" };
  if (typeof range?.high === "number" || typeof range?.low === "number") return { flag: "normal", label: "Normal" };
  return { flag: "pending", label: "No range" };
}

function rangeText(v: RecordValue) {
  const { low, high, text } = v.referenceRange ?? {};
  if (text) return text;
  if (typeof low === "number" && typeof high === "number") return `Normal: ${formatNumber(low)} to ${formatNumber(high)}`;
  if (typeof high === "number") return `Normal: under ${formatNumber(high)}`;
  if (typeof low === "number") return `Normal: ${formatNumber(low)} or more`;
  return undefined;
}

/** Where a value sits on its range bar: the normal range spans the middle half. */
function positionOf(v: RecordValue) {
  const { low, high } = v.referenceRange ?? {};
  if (typeof low !== "number" || typeof high !== "number" || high <= low) return undefined;
  return Math.min(0.98, Math.max(0.02, 0.25 + ((v.value - low) / (high - low)) * 0.5));
}

const codeOf = (v: RecordValue) => (v.code || v.name).trim().toLowerCase();

const SOURCE_NAMES: Record<string, string> = {
  pod: "Pod screening",
  upload: "Uploaded by the member",
  whatsapp: "Sent by the member on WhatsApp",
  abha: "Pulled from the member’s ABHA account",
  consult: "From a HealthMatrix consult",
};

/** Up to two trend charts, for the readings with the most history. */
function buildCharts(records: RecordDoc[]): ChartSpec[] {
  const series = new Map<string, { name: string; unit: string; points: { at: Date; value: number }[]; range?: RecordValue["referenceRange"] }>();
  for (const record of [...records].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())) {
    for (const v of record.values ?? []) {
      const key = codeOf(v);
      const entry = series.get(key) ?? { name: v.name, unit: v.unit ?? "", points: [], range: v.referenceRange };
      entry.points.push({ at: record.recordedAt, value: v.value });
      series.set(key, entry);
    }
  }

  return [...series.values()]
    .filter((s) => s.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 2)
    .map((s) => {
      const points = s.points.slice(-8);
      const months = points.map((p) => formatMonth(p.at));
      const labels = new Set(months).size === months.length ? months : points.map((p) => formatShortDate(p.at));
      const { low, high } = s.range ?? {};
      return {
        title: s.name,
        unit: s.unit,
        labels,
        series: [{ name: s.name, values: points.map((p) => p.value) }],
        bands:
          typeof low === "number" && typeof high === "number"
            ? [{ from: low, to: high, tone: "success" as const, label: `Normal ${formatNumber(low)} to ${formatNumber(high)}` }]
            : undefined,
        caption: `${points.length} readings, ${formatDate(points[0].at)} to ${formatDate(points[points.length - 1].at)}`,
      };
    });
}

/** A prescription's first lines at a glance: "Metformin 500 mg, HbA1c test + 2 more". */
function previewOf(items: string[]) {
  const lines = clean(items);
  if (!lines.length) return undefined;
  const more = lines.length > 2 ? ` + ${lines.length - 2} more` : "";
  return lines.slice(0, 2).join(", ") + more;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * A pod booking for the lab card. One with a filed record is ready whatever Mobilab last said;
 * `unchecked` holds the bookings Mobilab couldn't be asked about just now.
 */
function toLabBooking(booking: BookingDoc, sampleRecords: Set<string>, unchecked: Set<string>): LabBooking {
  const id = String(booking._id);
  const recordId = booking.result ? String(booking.result) : undefined;
  const stage = stageOf(recordId ? "report_generated" : booking.mobilab?.status);
  const tests = booking.tests?.length ?? 0;
  const note = unchecked.has(id)
    ? "Couldn’t reach the lab just now, so this is the last status it gave."
    : stage.ready && !recordId
      ? "The report is out, but its results couldn’t be loaded yet. Try again in a minute."
      : stage.note;

  return {
    id,
    reference: booking.mobilab?.bookingId ?? "",
    title: booking.profiles?.length ? booking.profiles.join(", ") : plural(tests, "test"),
    subtitle: `${plural(tests, "test")} at ${booking.pod?.name ?? "a pod"}, booked ${formatDate(booking.createdAt)}`,
    stage: { label: stage.label, tone: stage.tone },
    note,
    recordId,
    isSample: Boolean(recordId && sampleRecords.has(recordId)),
  };
}

/**
 * The full record, only while the patient's OTP keeps it open; `null` otherwise.
 * Opening it is logged on the access grant.
 */
export const getPatientRecord = cache(async (id: string): Promise<PatientRecord | null> => {
  const found = await getPatient(id);
  if (!found || found.patient.access.status !== "active") return null;
  const doctorId = await currentDoctorId();
  const member = new Types.ObjectId(id);

  // Pod bookings first, so results Mobilab has just finished are filed before the record is read.
  const born = await MemberModel.findById(member).select("dateOfBirth").lean();
  const unchecked = await syncMemberBookings({ _id: member, dateOfBirth: born?.dateOfBirth });

  const [records, bookings, signed, draft, consult] = await Promise.all([
    HealthRecordModel.find({ member }).sort({ recordedAt: -1 }).limit(200).lean<RecordDoc[]>(),
    BookingModel.find({ member, "mobilab.bookingId": { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean<BookingDoc[]>(),
    // What each signed prescription on the timeline holds, by any doctor.
    PrescriptionModel.find({ member, status: "signed", healthRecord: { $exists: true } }).select("healthRecord items tests").lean(),
    PrescriptionModel.findOne({ doctor: doctorId, member, status: "draft" }).sort({ updatedAt: -1 }).lean(),
    ConsultModel.findOne({ doctor: doctorId, member, ekaaySummary: { $nin: [null, ""] } })
      .sort({ scheduledAt: -1 })
      .select("ekaaySummary")
      .lean(),
  ]);
  await logView(found.grantId, "Full record");
  const sampleRecords = new Set(records.filter((r) => r.isSample).map((r) => String(r._id)));
  const itemsOf = new Map(
    signed.map((p) => [String(p.healthRecord), [...(p.items ?? []), ...labTestsOf(p.tests).map((t) => t.name)]]),
  );

  return {
    summary: clean(consult?.ekaaySummary?.split(/\n+/).map((line) => line.replace(/^[-•*]\s*/, ""))),
    medicines: found.medicines,
    // Prescriptions only: lab results show on the lab tests card, vaccines on their own card.
    timeline: records
      .filter((r) => r.type === "prescription")
      .map(
        (r): TimelineEntry => ({
          id: String(r._id),
          date: formatDate(r.recordedAt),
          title: r.title,
          type: r.type,
          preview: previewOf(itemsOf.get(String(r._id)) ?? []),
        }),
      ),
    charts: buildCharts(records),
    labBookings: bookings.map((b) => toLabBooking(b, sampleRecords, unchecked)),
    labConnected: mobilabReady(),
    draft: await draftRef(draft),
  };
});

/** One timeline entry, only while the record is open. */
export async function getRecordDetail(memberId: string, recordId: string) {
  const found = await getPatient(memberId);
  const recordObjectId = asId(recordId);
  if (!found || !recordObjectId) return null;
  if (found.patient.access.status !== "active") return { found, entry: null, detail: null };

  const record = await HealthRecordModel.findOne({ _id: recordObjectId, member: memberId }).lean<RecordDoc>();
  if (!record) return null;
  await logView(found.grantId, record.title);

  const prescription =
    record.type === "prescription"
      ? await PrescriptionModel.findOne({ healthRecord: record._id }).select("items tests").lean()
      : null;
  const vaccines = prescription ? await vaccinesFor([prescription._id]) : [];
  // A pod screening's booking: which tests were booked, for the ones that came back without a value.
  const booking = record.booking ? await BookingModel.findById(record.booking).select("tests").lean() : null;
  const missing = booking ? missingTests(booking.tests ?? [], record.values ?? []) : [];
  const values: DetailValue[] | undefined = record.values?.length
    ? record.values.map((v) => ({
        name: v.name,
        value: valueText(v),
        range: rangeText(v),
        position: positionOf(v),
        group: v.group ?? undefined,
        ...flagOf(v),
      }))
    : undefined;

  const detail: RecordDetail = {
    source: [SOURCE_NAMES[record.source] ?? "Added to the timeline", record.provider].filter(Boolean).join(", ") + ".",
    values,
    items: prescription?.items?.length ? prescription.items : undefined,
    tests: prescription?.tests?.length ? labTestsOf(prescription.tests).map(describeLabTest) : undefined,
    vaccines: vaccines.length ? vaccines : undefined,
    explains: record.ekaayNote?.trim() || undefined,
    files: record.files?.length ?? 0,
    remarks: record.remarks?.trim() || undefined,
    isSample: record.isSample || undefined,
    missing: missing.length ? missing : undefined,
    report: Boolean(record.booking),
  };
  const entry: TimelineEntry = { id: recordId, date: formatDate(record.recordedAt), title: record.title, type: record.type };
  return { found, entry, detail };
}

/**
 * A fresh link to a pod screening's PDF report, only while the record is open; opening it is
 * logged on the grant. `null` when there is no such report to ask for. Mobilab's links last
 * about an hour, so they are never stored.
 */
export async function getScreeningReport(
  memberId: string,
  recordId: string,
): Promise<{ url: string } | { problem: "not-ready" | "unavailable" } | null> {
  const found = await getPatient(memberId);
  const recordObjectId = asId(recordId);
  if (!found || !recordObjectId || found.patient.access.status !== "active") return null;

  const record = await HealthRecordModel.findOne({ _id: recordObjectId, member: memberId, type: "pod_screening" })
    .select("booking title")
    .lean();
  const booking = record?.booking ? await BookingModel.findById(record.booking).select("mobilab.bookingId").lean() : null;
  const reference = booking?.mobilab?.bookingId;
  if (!record || !reference) return null;

  try {
    const url = await getMobilabReportUrl(reference);
    if (!url) return { problem: "not-ready" };
    await logView(found.grantId, `${record.title}, PDF report`);
    return { url };
  } catch (error) {
    console.error(`[pod-bookings] report for ${reference} failed:`, String(error));
    return { problem: "unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Vaccines

type VaccinationDoc = Doc<Vaccination>;

/** A stored vaccine back in the dialog's shape, for editing a draft. */
function toVaccineInput(v: VaccinationDoc): VaccineInput {
  return {
    name: v.name,
    brand: v.brand ?? undefined,
    doseAmount: v.dose?.amount ?? 0,
    doseUnit: v.dose?.unit ?? "mL",
    route: v.route,
    site: v.site ?? undefined,
    schedule: v.schedule?.type ?? "one_time",
    everyCount: v.schedule?.every?.count ?? undefined,
    everyUnit: v.schedule?.every?.unit ?? undefined,
    startDose: v.doses[0]?.number ?? 1,
    dates: v.doses.map((d) => dateToDay(d.dueOn)),
    instructions: v.instructions ?? undefined,
  };
}

/** A draft prescription with its vaccines, ready to edit. */
async function draftRef(draft: { _id: Id; items?: string[] | null; tests?: SavedLabTest[] | null } | null): Promise<DraftRef | null> {
  if (!draft) return null;
  const vaccines = await VaccinationModel.find({ prescription: draft._id }).sort({ createdAt: 1 }).lean<VaccinationDoc[]>();
  return { id: String(draft._id), items: draft.items ?? [], vaccines: vaccines.map(toVaccineInput), tests: labTestsOf(draft.tests) };
}

/**
 * Vaccines as shown in the console. A dose is given once the patient marks its reminder taken in
 * the app (a `log` entry with `takenAt`); past its date without that, it is overdue.
 */
async function toVaccineViews(docs: VaccinationDoc[]): Promise<VaccineView[]> {
  const reminderIds = docs.flatMap((v) => v.doses.map((d) => d.reminder).filter((id): id is Id => Boolean(id)));
  const reminders = reminderIds.length
    ? await ReminderModel.find({ _id: { $in: reminderIds } }).select("log").lean()
    : [];
  const takenOn = new Map(
    reminders.flatMap((r) => {
      const taken = r.log?.find((entry) => entry.takenAt)?.takenAt;
      return taken ? [[String(r._id), taken] as const] : [];
    }),
  );
  const today = todayInIndia();

  return docs.map((v) => {
    const input = toVaccineInput(v);
    return {
      id: String(v._id),
      name: v.name,
      brand: v.brand ?? undefined,
      doseText: describeDose(input),
      scheduleText: describeSchedule(input),
      instructions: v.instructions ?? undefined,
      doses: v.doses.map((d) => {
        const day = dateToDay(d.dueOn);
        const taken = d.reminder ? takenOn.get(String(d.reminder)) : undefined;
        const status: DoseStatus =
          v.status === "cancelled" ? "cancelled" : taken ? "given" : day < today ? "overdue" : "due";
        return {
          number: d.number,
          total: v.schedule?.totalDoses ?? v.doses.length,
          dueOn: formatDay(day),
          status,
          givenOn: taken ? formatDay(dateToDay(taken)) : undefined,
        };
      }),
    };
  });
}

/** The vaccines on these prescriptions, in the order they were added. */
async function vaccinesFor(prescriptionIds: Id[]) {
  const docs = await VaccinationModel.find({ prescription: { $in: prescriptionIds } })
    .sort({ createdAt: 1 })
    .lean<VaccinationDoc[]>();
  return toVaccineViews(docs);
}

/** Vaccines this doctor has scheduled for a patient, only while their record is open. */
export async function getVaccineSchedule(memberId: string) {
  const found = await getPatient(memberId);
  if (!found || found.patient.access.status !== "active") return [];
  const doctorId = await currentDoctorId();
  const docs = await VaccinationModel.find({ doctor: doctorId, member: memberId, status: "scheduled" })
    .sort({ "doses.0.dueOn": 1 })
    .lean<VaccinationDoc[]>();
  return toVaccineViews(docs);
}

// ---------------------------------------------------------------------------
// Consults

type ConsultDoc = Awaited<ReturnType<typeof findConsults>>[number];

function findConsults(filter: Record<string, unknown>) {
  return ConsultModel.find({ status: { $ne: "cancelled" }, ...filter }).sort({ scheduledAt: 1 }).lean();
}

const MINUTE_MS = 60 * 1000;

/** The app lets the member join from 5 minutes before the slot to 30 minutes after it ends. */
function inJoinWindow(c: ConsultDoc, now: Date) {
  const start = c.scheduledAt.getTime();
  const end = start + (c.durationMinutes ?? 30) * MINUTE_MS;
  return now.getTime() >= start - 5 * MINUTE_MS && now.getTime() <= end + 30 * MINUTE_MS;
}

/** Ids of the consults whose member is in the app's waiting room, asked of Twilio in parallel. */
async function waitingConsults(docs: ConsultDoc[], now: Date) {
  if (!videoReady()) return new Set<string>();
  const candidates = docs.filter((c) => c.status === "scheduled" && inJoinWindow(c, now)).map((c) => String(c._id));
  const present = await Promise.all(candidates.map((id) => patientInRoom(id).catch(() => false)));
  return new Set(candidates.filter((_, i) => present[i]));
}

/** `withWaiting`: find out who is in the waiting room, for the Today and Schedule lists. */
async function toConsults(doctorId: Id, docs: ConsultDoc[], { withWaiting = false } = {}) {
  const now = new Date();
  const [patients, waiting] = await Promise.all([
    loadPatients(doctorId, docs.map((c) => c.member)),
    withWaiting ? waitingConsults(docs, now) : new Set<string>(),
  ]);
  return docs.flatMap((c): Consult[] => {
    const entry = patients.get(String(c.member));
    if (!entry) return [];
    return [
      {
        id: String(c._id),
        patient: entry.patient,
        day: dayLabel(c.scheduledAt, now),
        time: formatTime(c.scheduledAt),
        startsAt: c.scheduledAt.toISOString(),
        endsAt: new Date(c.scheduledAt.getTime() + (c.durationMinutes ?? 30) * MINUTE_MS).toISOString(),
        mode: c.mode === "video_from_pod" ? "Video from pod" : "Video",
        reason: c.reason?.trim() || "No reason given",
        status: c.status as Consult["status"],
        startedAt: c.status === "in_progress" && c.startedAt ? c.startedAt.toISOString() : undefined,
        patientWaiting: waiting.has(String(c._id)),
      },
    ];
  });
}

/** Today's consults, in time order. Once per request: the tab title counts who is waiting too. */
export const getTodayConsults = cache(async () => {
  const doctorId = await currentDoctorId();
  const docs = await findConsults({ doctor: doctorId, scheduledAt: { $gte: istDayStart(), $lt: istDayStart(new Date(), 1) } });
  return toConsults(doctorId, docs, { withWaiting: true });
});

/** Today and the next two weeks, plus anything still in progress from before. Once per request. */
export const getSchedule = cache(async () => {
  const doctorId = await currentDoctorId();
  const docs = await findConsults({
    doctor: doctorId,
    $or: [
      { scheduledAt: { $gte: istDayStart(), $lt: istDayStart(new Date(), 15) } },
      { status: "in_progress" },
    ],
  });
  return toConsults(doctorId, docs, { withWaiting: true });
});

/** "(1 waiting) Today": the tab title says when a patient is in the waiting room. */
export function waitingTitle(screen: string, consults: Consult[]) {
  const waiting = consults.filter((c) => c.patientWaiting).length;
  return waiting ? `(${waiting} waiting) ${screen}` : screen;
}

/** One of this doctor's consults, with the record when it is open. */
export async function getConsult(id: string) {
  const consultId = asId(id);
  if (!consultId) return null;
  const doctorId = await currentDoctorId();
  const doc = await ConsultModel.findOne({ _id: consultId, doctor: doctorId }).lean();
  if (!doc) return null;
  const [consult] = await toConsults(doctorId, [doc]);
  if (!consult) return null;

  const found = await getPatient(consult.patient.id);
  const record = await getPatientRecord(consult.patient.id);
  const draft = await PrescriptionModel.findOne({ doctor: doctorId, consult: consultId, status: "draft" })
    .sort({ updatedAt: -1 })
    .lean();
  return {
    consult: { ...consult, day: dayLabel(doc.scheduledAt) },
    nominee: found?.nominee,
    allergyTerms: found?.allergyTerms ?? [],
    // Prefer this consult's own summary and draft.
    record: record && {
      ...record,
      summary: doc.ekaaySummary ? clean(doc.ekaaySummary.split(/\n+/)) : record.summary,
      draft: draft ? await draftRef(draft) : record.draft,
    },
  };
}

// ---------------------------------------------------------------------------
// Consult requests: a patient asking for a time that isn't one of the open slots

type RequestDoc = Awaited<ReturnType<typeof findOpenRequests>>[number];
type SignedInDoctor = Awaited<ReturnType<typeof requireDoctor>>;

/** How far back a booked or running consult can still hold time now. */
const BUSY_LOOKBACK_MS = 2 * 60 * 60 * 1000;

/** Requests still waiting for an answer whose time hasn't passed, soonest first. */
function findOpenRequests(doctorId: Id, now: Date, before?: Date) {
  return ConsultRequestModel.find({
    doctor: doctorId,
    status: "pending",
    requestedAt: before ? { $gt: now, $lt: before } : { $gt: now },
  })
    .sort({ requestedAt: 1 })
    .lean();
}

/** How long a request the doctor never answered stays on their list, marked not attended. */
const MISSED_SHOWN_MS = 24 * 60 * 60 * 1000;

/** Requests whose time passed with no reply, in the last day, most recent first. */
function findMissedRequests(doctorId: Id, now: Date) {
  return ConsultRequestModel.find({
    doctor: doctorId,
    status: "pending",
    requestedAt: { $lte: now, $gt: new Date(now.getTime() - MISSED_SHOWN_MS) },
  })
    .sort({ requestedAt: -1 })
    .lean();
}

/** Each request with what the doctor needs to answer it: who, when, and whether it suits them. */
async function toRequests(doctor: SignedInDoctor, docs: RequestDoc[], now: Date): Promise<ConsultRequest[]> {
  if (docs.length === 0) return [];
  const schedule = resolveSchedule(doctor.schedule as SavedSchedule);
  const booked = await ConsultModel.find({
    doctor: doctor._id,
    status: { $in: ["scheduled", "in_progress"] },
    scheduledAt: { $gte: new Date(now.getTime() - BUSY_LOOKBACK_MS) },
  })
    .select("member status scheduledAt durationMinutes startedAt")
    .lean();
  const [patients, bookedMembers] = await Promise.all([
    loadPatients(doctor._id, docs.map((r) => r.member)),
    MemberModel.find({ _id: { $in: booked.map((c) => c.member) } })
      .select("name")
      .lean(),
  ]);
  const nameOf = new Map(bookedMembers.map((m) => [String(m._id), toRef(m).name]));

  return docs.flatMap((r): ConsultRequest[] => {
    const entry = patients.get(String(r.member));
    if (!entry) return [];
    if (r.requestedAt <= now) {
      // Its time passed with no reply: shown as not attended, with nothing left to decide.
      return [
        {
          id: String(r._id),
          patient: entry.patient,
          about: ageAndSex(entry.patient) || undefined,
          when: `${dayLabel(r.requestedAt, now)}, ${formatTime(r.requestedAt)}`,
          reason: r.reason?.trim() || undefined,
          askedAgo: timeAgo(r.createdAt, now),
          missed: true,
        },
      ];
    }
    const start = r.requestedAt.getTime();
    const end = start + r.durationMinutes * MINUTE_MS;
    const clash = booked.find((c) => {
      const held = consultBusy(c, now);
      return held !== null && start < held.end && held.start < end;
    });
    const fits = consultFits(schedule, { scheduledAt: r.requestedAt, durationMinutes: r.durationMinutes });
    const day = dayLabel(r.requestedAt, now);
    return [
      {
        id: String(r._id),
        patient: entry.patient,
        about: ageAndSex(entry.patient) || undefined,
        when: `${day}, ${formatTime(r.requestedAt)}`,
        inHowLong: day === "Today" ? timeLeft(r.requestedAt, now) : undefined,
        reason: r.reason?.trim() || undefined,
        askedAgo: timeAgo(r.createdAt, now),
        warning: clash
          ? `Clashes with ${nameOf.get(String(clash.member)) ?? "another patient"} at ${formatTime(clash.scheduledAt)}`
          : fits
            ? undefined
            : "Outside your hours",
      },
    ];
  });
}

/**
 * Requests waiting for an answer, soonest first, then those whose time passed in the last day
 * with no reply (`missed`), so the doctor sees what went unattended; the app tells the patient
 * it got no reply. `withinWindow`: only waiting times inside the doctor's booking window, for
 * Schedule.
 */
export async function getConsultRequests({ withinWindow = false } = {}) {
  const doctor = await requireDoctor();
  await connectDB();
  const now = new Date();
  const before = withinWindow
    ? istDayStart(now, resolveSchedule(doctor.schedule as SavedSchedule).bookingWindowDays)
    : undefined;
  const [open, missed] = await Promise.all([
    findOpenRequests(doctor._id, now, before),
    findMissedRequests(doctor._id, now),
  ]);
  return toRequests(doctor, [...open, ...missed], now);
}

/** How many requests wait for an answer, for the badges on Today and Schedule. */
export async function getOpenRequestCount() {
  const doctor = await requireDoctor();
  await connectDB();
  return ConsultRequestModel.countDocuments({ doctor: doctor._id, status: "pending", requestedAt: { $gt: new Date() } });
}

// ---------------------------------------------------------------------------
// Prescriptions

const SOURCE_LABELS: Record<string, string> = { voice_note: "Voice note", photo: "Photo of a note", typed: "Typed" };

type SavedLabTest = { kind: string; code: string; name: string; tests?: string[] | null };

/** A prescription's lab tests as saved, in the shape the screens and the draft use. */
function labTestsOf(tests: SavedLabTest[] | null | undefined): LabTestInput[] {
  return (tests ?? []).map((t) => ({
    kind: t.kind === "profile" ? "profile" : "test",
    code: t.code,
    name: t.name,
    tests: t.tests?.length ? [...t.tests] : [t.code],
  }));
}

export async function getPrescriptions(status: string) {
  const doctorId = await currentDoctorId();
  const filter = status === "draft" || status === "signed" ? { status: status as Prescription["status"] } : {};
  const docs = await PrescriptionModel.find({ doctor: doctorId, ...filter }).sort({ updatedAt: -1 }).limit(200).lean();
  const [patients, counts] = await Promise.all([
    loadPatients(doctorId, docs.map((d) => d.member)),
    VaccinationModel.aggregate<{ _id: Id; n: number }>([
      { $match: { prescription: { $in: docs.map((d) => d._id) }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$prescription", n: { $sum: 1 } } },
    ]),
  ]);
  const vaccineCount = new Map(counts.map((c) => [String(c._id), c.n]));
  return docs.flatMap((d): Prescription[] => {
    const entry = patients.get(String(d.member));
    if (!entry) return [];
    return [
      {
        id: String(d._id),
        patient: entry.patient,
        date: formatDate(d.signedAt ?? d.updatedAt),
        status: d.status as Prescription["status"],
        source: SOURCE_LABELS[d.source] ?? "Typed",
        items: d.items ?? [],
        vaccineCount: vaccineCount.get(String(d._id)) ?? 0,
        tests: labTestsOf(d.tests),
      },
    ];
  });
}

export async function getPrescription(id: string) {
  const prescriptionId = asId(id);
  if (!prescriptionId) return null;
  const doctorId = await currentDoctorId();
  const doc = await PrescriptionModel.findOne({ _id: prescriptionId, doctor: doctorId }).lean();
  if (!doc) return null;
  const found = await getPatient(String(doc.member));
  if (!found) return null;
  const vaccines = await vaccinesFor([doc._id]);
  return {
    rx: {
      id: String(doc._id),
      patient: found.patient,
      date: formatDate(doc.signedAt ?? doc.updatedAt),
      status: doc.status as Prescription["status"],
      source: SOURCE_LABELS[doc.source] ?? "Typed",
      items: doc.items ?? [],
      vaccineCount: vaccines.length,
      tests: labTestsOf(doc.tests),
    } satisfies Prescription,
    vaccines,
    draft: doc.status === "draft" ? await draftRef(doc) : null,
    signedAt: doc.signedAt ? formatWhen(doc.signedAt) : undefined,
    consultId: doc.consult ? String(doc.consult) : undefined,
    allergyTerms: found.allergyTerms,
  };
}

/** Patients whose record is open, with what the safety checks need. */
export async function getPrescriptionPatients() {
  const doctorId = await currentDoctorId();
  const memberIds = await AccessGrantModel.distinct("member", {
    doctor: doctorId,
    status: "active",
    expiresAt: { $gt: new Date() },
  });
  const patients = await loadPatients(doctorId, memberIds as Id[]);
  return [...patients.values()]
    .filter(({ access }) => access.status === "active")
    .map(({ patient, profile }) => ({
      id: patient.id,
      name: patient.name,
      firstName: patient.firstName,
      allergies: clean(profile?.allergies),
      allergyTerms: allergyTerms(clean(profile?.allergies)),
      medicines: clean(profile?.medicines),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Test orders

async function wherePerOrder(orders: { booking?: Id | null; provider?: string | null }[]) {
  const bookingIds = orders.map((o) => o.booking).filter((id): id is Id => Boolean(id));
  const bookings = bookingIds.length
    ? await BookingModel.find({ _id: { $in: bookingIds } }).select("pod createdAt").lean<BookingDoc[]>()
    : [];
  // Pod bookings are walk-in (no time slot) and keep the pod's name as it was when booked.
  const bookingText = new Map(
    bookings.map((b) => [
      String(b._id),
      [b.pod?.name && `${b.pod.name} pod`, `booked ${formatDate(b.createdAt)}`].filter(Boolean).join(", "),
    ]),
  );
  return (order: { booking?: Id | null; provider?: string | null }) =>
    (order.booking && bookingText.get(String(order.booking))) || order.provider?.trim() || "Not booked yet";
}

export async function getTestOrders(status: string) {
  const doctorId = await currentDoctorId();
  const statuses: TestOrderStatus[] = ["awaiting_booking", "booked", "result_back", "reviewed"];
  const filter = statuses.includes(status as TestOrderStatus) ? { status: status as TestOrderStatus } : {};
  const docs = await TestOrderModel.find({ doctor: doctorId, ...filter }).sort({ orderedAt: -1 }).limit(200).lean();
  const [patients, where] = await Promise.all([loadPatients(doctorId, docs.map((d) => d.member)), wherePerOrder(docs)]);

  return docs.flatMap((d): TestOrder[] => {
    const entry = patients.get(String(d.member));
    if (!entry) return [];
    const result = d.result?.summary
      ? {
          value: d.result.summary,
          flag: (d.result.flag === "watch" ? "borderline" : (d.result.flag ?? "pending")) as ResultFlag,
          label: d.result.label || FLAG_LABELS[d.result.flag ?? ""] || "Result",
          date: d.result.resultedAt ? formatDate(d.result.resultedAt) : "",
        }
      : undefined;
    return [
      {
        id: String(d._id),
        patient: toRef(entry.member),
        test: d.test,
        orderedOn: formatDate(d.orderedAt),
        where: where(d),
        status: d.status as TestOrderStatus,
        result,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Access log

export async function getAccessLog(): Promise<AccessLogEntry[]> {
  const doctorId = await currentDoctorId();
  const rows = await AccessLogModel.find({ doctor: doctorId }).sort({ requestedAt: -1 }).limit(200).lean();
  const members = await MemberModel.find({ _id: { $in: rows.map((r) => r.member) } }).select("name").lean();
  const memberOf = new Map(members.map((m) => [String(m._id), m]));
  const now = new Date();

  return rows.flatMap((row): AccessLogEntry[] => {
    const member = memberOf.get(String(row.member));
    if (!member) return [];
    const expiresAt = row.expiresAt ?? undefined;
    let status: AccessStatus = row.status as AccessStatus;
    let approvedBy = row.approvedBy?.name
      ? `${row.approvedBy.name.split(/\s+/)[0]} (${row.approvedBy.role ?? "patient"})`
      : "Waiting for OTP";
    if (row.status === "active" && expiresAt && expiresAt <= now) status = "expired";
    if (row.status === "pending" && (!expiresAt || expiresAt <= now)) {
      status = "none";
      approvedBy = "OTP not shared";
    }
    return [
      {
        id: String(row._id),
        at: formatWhen(row.requestedAt ?? row.createdAt, now),
        patient: toRef(member),
        what: row.what,
        approvedBy,
        status,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Today

export async function getTodayStats() {
  const doctorId = await currentDoctorId();
  const now = new Date();
  const [recordsOpen, drafts, newResults] = await Promise.all([
    AccessGrantModel.countDocuments({ doctor: doctorId, status: "active", expiresAt: { $gt: now } }),
    PrescriptionModel.countDocuments({ doctor: doctorId, status: "draft" }),
    TestOrderModel.countDocuments({ doctor: doctorId, status: "result_back" }),
  ]);
  return { recordsOpen, drafts, newResults };
}

/** Out-of-range readings in the newest record of each patient whose record is open. */
export async function getAttentionFlags(): Promise<AttentionFlag[]> {
  const doctorId = await currentDoctorId();
  const memberIds = (await AccessGrantModel.distinct("member", {
    doctor: doctorId,
    status: "active",
    expiresAt: { $gt: new Date() },
  })) as Id[];
  if (!memberIds.length) return [];

  const [members, records] = await Promise.all([
    MemberModel.find({ _id: { $in: memberIds } }).select("name").lean(),
    HealthRecordModel.aggregate<RecordDoc>([
      { $match: { member: { $in: memberIds }, "values.0": { $exists: true } } },
      { $sort: { recordedAt: -1 } },
      { $group: { _id: "$member", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]),
  ]);
  const memberOf = new Map(members.map((m) => [String(m._id), m]));
  const toneOf: Partial<Record<ResultFlag, Tone>> = { high: "danger", low: "danger", borderline: "warning" };

  return records.flatMap((record) => {
    const member = memberOf.get(String(record.member));
    if (!member) return [];
    const flagged = (record.values ?? [])
      .map((v) => ({ v, ...flagOf(v) }))
      .filter(({ flag }) => toneOf[flag]);
    if (!flagged.length) return [];
    const worst = flagged.find(({ flag }) => flag !== "borderline") ?? flagged[0];
    const more = flagged.length > 1 ? ` ${flagged.length - 1} more out of range.` : "";
    return [
      {
        patient: toRef(member),
        text: `${worst.v.name} ${valueText(worst.v)}, ${worst.label.toLowerCase()}, on ${formatDate(record.recordedAt)}.${more}`,
        tone: toneOf[worst.flag]!,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Notifications

const NOTIFICATION_DAYS = 14;

/** What became of a request that no longer waits for an answer, for its notification. */
const REQUEST_OUTCOME: Record<string, string> = {
  approved: "You approved it, and it’s on your schedule.",
  declined: "You declined it.",
  withdrawn: "They withdrew it.",
};

/** A consult this close to its start shows as starting soon. */
const STARTING_SOON_MS = 10 * 60 * 1000;

/**
 * Built from what happened: shared records, OTPs waiting, results back, access ending,
 * bookings and cancellations, and consults about to start. The doctor's alert switches
 * decide which of these are listed.
 */
export async function getNotifications() {
  const doctor = await requireDoctor();
  await connectDB();
  const now = new Date();
  const since = new Date(now.getTime() - NOTIFICATION_DAYS * 24 * 60 * 60 * 1000);
  const seenAt = doctor.settings?.notificationsSeenAt ?? new Date(0);
  const { alerts } = resolveSettings(doctor.settings);

  const [logs, results, booked, cancelled, starting, asked, withdrawn] = await Promise.all([
    alerts.otp
      ? AccessLogModel.find({ doctor: doctor._id, updatedAt: { $gte: since } }).sort({ updatedAt: -1 }).limit(50).lean()
      : [],
    alerts.results
      ? TestOrderModel.find({ doctor: doctor._id, status: "result_back" }).sort({ updatedAt: -1 }).limit(50).lean()
      : [],
    alerts.bookings
      ? ConsultModel.find({ doctor: doctor._id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50).lean()
      : [],
    // Before consults said who cancelled, only members could.
    alerts.bookings
      ? ConsultModel.find({ doctor: doctor._id, status: "cancelled", cancelledBy: { $ne: "doctor" }, cancelledAt: { $gte: since } })
          .sort({ cancelledAt: -1 })
          .limit(50)
          .lean()
      : [],
    alerts.starting ? findStartingSoon(doctor._id, now) : [],
    alerts.bookings
      ? ConsultRequestModel.find({ doctor: doctor._id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50).lean()
      : [],
    alerts.bookings
      ? ConsultRequestModel.find({ doctor: doctor._id, status: "withdrawn", respondedAt: { $gte: since } })
          .sort({ respondedAt: -1 })
          .limit(50)
          .lean()
      : [],
  ]);
  const memberIds = [...logs, ...results, ...booked, ...cancelled, ...starting, ...asked, ...withdrawn].map((r) => r.member);
  const members = await MemberModel.find({ _id: { $in: memberIds } })
    .select("name")
    .lean();
  const memberOf = new Map(members.map((m) => [String(m._id), toRef(m)]));

  const items: (Omit<Notification, "time" | "unread"> & { at: Date })[] = [];
  for (const log of logs) {
    const patient = memberOf.get(String(log.member));
    if (!patient) continue;
    const href = `/patients/${patient.id}`;
    if (log.approvedAt) {
      const by = log.approvedBy?.role === "nominee" ? `nominee ${log.approvedBy.name ?? ""}’s` : "their";
      items.push({
        id: `${log._id}-shared`,
        at: log.approvedAt,
        title: `${patient.name} shared their record`,
        body: `Opened with ${by} OTP. It stays open for 24 hours.`,
        href,
        tone: "success",
      });
      if (log.expiresAt && log.expiresAt <= now && log.expiresAt >= since) {
        items.push({
          id: `${log._id}-expired`,
          at: log.expiresAt,
          title: `${patient.firstName}’s access expired`,
          body: "It ended on its own after 24 hours. Ask for a new OTP to reopen it.",
          href,
          tone: "neutral",
        });
      }
    } else if (log.status === "pending" && log.expiresAt && log.expiresAt > now) {
      items.push({
        id: `${log._id}-pending`,
        at: log.requestedAt ?? log.createdAt,
        title: `Waiting for ${patient.firstName}’s OTP`,
        body: "The OTP was sent. Enter it on their page once they share it.",
        href,
        tone: "warning",
      });
    }
  }
  for (const order of results) {
    const patient = memberOf.get(String(order.member));
    if (!patient) continue;
    const flag = order.result?.flag;
    items.push({
      id: `${order._id}-result`,
      at: order.result?.resultedAt ?? order.updatedAt,
      title: `Result back: ${patient.name}`,
      body: [order.test, order.result?.summary, order.result?.label].filter(Boolean).join(". ") + ".",
      href: "/results?status=result_back",
      tone: flag === "high" || flag === "low" ? "danger" : flag === "borderline" || flag === "watch" ? "warning" : "brand",
    });
  }
  for (const consult of booked) {
    const patient = memberOf.get(String(consult.member));
    if (!patient) continue;
    items.push({
      id: `${consult._id}-booked`,
      at: consult.createdAt,
      title: `${patient.name} booked a consult`,
      body: [formatWhen(consult.scheduledAt, now), consult.reason?.trim()].filter(Boolean).join(". ") + ".",
      href: `/consults/${consult._id}`,
      tone: "brand",
    });
  }
  for (const consult of cancelled) {
    const patient = memberOf.get(String(consult.member));
    if (!patient || !consult.cancelledAt) continue;
    items.push({
      id: `${consult._id}-cancelled`,
      at: consult.cancelledAt,
      title: `${patient.name} cancelled their consult`,
      body: `It was for ${formatWhen(consult.scheduledAt, now)}. The slot is free again.`,
      href: "/schedule",
      tone: "neutral",
    });
  }
  for (const request of asked) {
    const patient = memberOf.get(String(request.member));
    if (!patient) continue;
    const open = request.status === "pending" && request.requestedAt > now;
    const missed = request.status === "pending" && !open;
    items.push({
      id: `${request._id}-asked`,
      at: request.createdAt,
      title: `${patient.name} asked for ${formatWhen(request.requestedAt, now)}`,
      body: open
        ? [request.reason?.trim(), "Approve or decline it on Today."].filter(Boolean).join(". ")
        : missed
          ? `Not attended: the time passed before you replied. ${patient.firstName} was told.`
          : (REQUEST_OUTCOME[request.status ?? ""] ?? "It was answered."),
      href: "/",
      tone: open ? "brand" : missed ? "warning" : "neutral",
    });
  }
  for (const request of withdrawn) {
    const patient = memberOf.get(String(request.member));
    if (!patient || !request.respondedAt) continue;
    items.push({
      id: `${request._id}-withdrawn`,
      at: request.respondedAt,
      title: `${patient.name} withdrew their request`,
      body: `It was for ${formatWhen(request.requestedAt, now)}.`,
      href: "/",
      tone: "neutral",
    });
  }
  for (const consult of starting) {
    const patient = memberOf.get(String(consult.member));
    if (!patient) continue;
    items.push({
      id: `${consult._id}-starting`,
      at: new Date(Math.min(now.getTime(), consult.scheduledAt.getTime() - STARTING_SOON_MS)),
      title: `${patient.firstName}’s consult starts at ${formatTime(consult.scheduledAt)}`,
      body: consult.reason?.trim() ? `About: ${consult.reason.trim()}` : "Open the consult to get ready.",
      href: `/consults/${consult._id}`,
      tone: "warning",
    });
  }

  const list: Notification[] = items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map(({ at, ...item }) => ({ ...item, time: formatShortWhen(at, now), unread: at > seenAt }));
  return { list, unread: list.filter((n) => n.unread).length };
}

function findStartingSoon(doctorId: Id, now: Date) {
  return ConsultModel.find({
    doctor: doctorId,
    status: "scheduled",
    scheduledAt: { $gte: now, $lte: new Date(now.getTime() + STARTING_SOON_MS) },
  })
    .sort({ scheduledAt: 1 })
    .lean();
}

/** Consults starting in the next few minutes, for the banner on Today. Empty when that alert is off. */
export async function getStartingSoon() {
  const doctor = await requireDoctor();
  if (!resolveSettings(doctor.settings).alerts.starting) return [];
  await connectDB();
  const docs = await findStartingSoon(doctor._id, new Date());
  return toConsults(doctor._id, docs);
}

// ---------------------------------------------------------------------------
// Settings

export const DEFAULT_SETTINGS = {
  /** Not used by the app yet; shown as coming soon. Bookings are `schedule.acceptingBookings`. */
  availability: { gpNow: true, podCalls: true },
  alerts: { otp: true, results: true, starting: true, bookings: true, ekaay: false },
};

export type SettingGroup = keyof typeof DEFAULT_SETTINGS;

type SavedSettings = Doc<Doctor>["settings"];

function resolveSettings(saved: SavedSettings) {
  const pick = <G extends SettingGroup>(group: G) =>
    Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS[group]).map(([key, fallback]) => {
        const value = (saved?.[group] as Record<string, boolean | null | undefined> | undefined)?.[key];
        return [key, typeof value === "boolean" ? value : fallback];
      }),
    ) as (typeof DEFAULT_SETTINGS)[G];
  return { availability: pick("availability"), alerts: pick("alerts") };
}

export async function getSettings() {
  const doctor = await requireDoctor();
  return resolveSettings(doctor.settings);
}

// ---------------------------------------------------------------------------
// Availability: when members can book, as the app reads it

export type TimeOffView = { id: string; label: string; note?: string; now: boolean };

export type Availability = {
  acceptingBookings: boolean;
  slotMinutes: number;
  bookingWindowDays: number;
  minNoticeMinutes: number;
  weekly: Session[];
  timeOff: TimeOffView[];
  /** Already away from now until midnight, so another "rest of today" would add nothing. */
  offRestOfToday: boolean;
};

/** Whether time off already covers everything from `now` to the end of the India-time day. */
export function offRestOfToday(timeOff: Schedule["timeOff"], now = new Date()) {
  const midnight = istInstant(istDateKey(now, 1), "00:00");
  return timeOff.some((t) => t.start <= now && t.end >= midnight);
}

const atMidnight = (date: Date) => istDayStart(date).getTime() === date.getTime();

/** "Fri 9 Oct to Sat 10 Oct", "Tomorrow", or "Thu 8 Oct, 10:00 am to 11:00 am". */
export function describeTimeOff(start: Date, end: Date, now = new Date()) {
  if (atMidnight(start) && atMidnight(end)) {
    const last = new Date(end.getTime() - 1);
    const first = dayLabel(start, now);
    const final = dayLabel(last, now);
    return first === final ? first : `${first} to ${final}`;
  }
  if (istDayStart(start).getTime() === istDayStart(end).getTime() || (atMidnight(end) && istDayStart(start, 1).getTime() === end.getTime())) {
    return `${dayLabel(start, now)}, ${formatTime(start)} to ${atMidnight(end) ? "midnight" : formatTime(end)}`;
  }
  return `${formatWhen(start, now)} to ${formatWhen(end, now)}`;
}

/** Part-day time off that touches a working day, as one line. */
function partDayNote(schedule: Schedule, date: string) {
  const dayStart = istInstant(date, "00:00").getTime();
  const dayEnd = dayStart + 86_400_000;
  const parts = schedule.timeOff.filter((t) => t.start.getTime() < dayEnd && dayStart < t.end.getTime());
  if (parts.length === 0) return undefined;
  return (
    "Away " +
    parts
      .map((t) => {
        const from = t.start.getTime() <= dayStart ? "start of day" : formatTime(t.start);
        const to = t.end.getTime() >= dayEnd ? "end of day" : formatTime(t.end);
        return `${from} to ${to}`;
      })
      .join(", ")
  );
}

export async function getAvailability(): Promise<Availability> {
  const doctor = await requireDoctor();
  await connectDB();
  const schedule = resolveSchedule(doctor.schedule as SavedSchedule);
  const now = new Date();

  return {
    acceptingBookings: schedule.acceptingBookings,
    slotMinutes: schedule.slotMinutes,
    bookingWindowDays: schedule.bookingWindowDays,
    minNoticeMinutes: schedule.minNoticeMinutes,
    weekly: schedule.weekly,
    timeOff: schedule.timeOff
      .filter((t) => t.end > now)
      .map((t) => ({
        id: t.id ?? "",
        label: describeTimeOff(t.start, t.end, now),
        note: t.note,
        now: t.start <= now,
      })),
    offRestOfToday: offRestOfToday(schedule.timeOff, now),
  };
}

/**
 * What each of the next two weeks looks like for the schedule list: "Day off", "Away" or a
 * part-day note, keyed by the same day labels consults use.
 */
export async function getDayNotes(): Promise<Record<string, string>> {
  const doctor = await requireDoctor();
  const schedule = resolveSchedule(doctor.schedule as SavedSchedule);
  const now = new Date();
  const notes: Record<string, string> = {};
  // Every working day, ignoring pauses and notice: this is about the doctor's own time.
  for (const day of slotDays({ ...schedule, acceptingBookings: true, minNoticeMinutes: 0, bookingWindowDays: 15 }, [], now)) {
    const label = dayLabel(istInstant(day.date, "12:00"), now);
    const note = day.off === "weekly" ? "Not a working day" : day.off === "time_off" ? "Time off" : partDayNote(schedule, day.date);
    if (note) notes[label] = note;
  }
  return notes;
}
