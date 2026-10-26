"use server";

import { isValidObjectId, Types } from "mongoose";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import {
  AccessGrantModel,
  AccessLogModel,
  BookingModel,
  ConsultModel,
  ConsultRequestModel,
  DoctorModel,
  EmergencyProfileModel,
  HealthRecordModel,
  MemberModel,
  PrescriptionModel,
  ReminderModel,
  TestOrderModel,
  VaccinationModel,
} from "@/models";

import { OTP_MAX_ATTEMPTS, OTP_RESEND_MS, requireDoctor } from "./auth";
import {
  ACCESS_OTP_TTL_MS,
  ACCESS_TTL_MS,
  DEFAULT_SETTINGS,
  isResultsPatient,
  offRestOfToday,
  type SettingGroup,
} from "./console-data";
import { formatWhen } from "./format";
import { connectDB } from "./db";
import { labTestsField, type LabCatalog, type LabTestInput } from "./lab-tests";
import { labCatalog, mobilabReady } from "./mobilab";
import { cancelOtp, checkOtp, OtpDeliveryError, sendOtp, type SentOtp } from "./otp-sender";
import { allergyClash, allergyTerms } from "./patient-text";
import {
  consultBusy,
  consultFits,
  isMissed,
  istDateKey,
  istInstant,
  LATE_START_MINUTES,
  LIMITS,
  resolveSchedule,
  scheduleInput,
  timeOffInput,
  timeOffRange,
  type SavedSchedule,
  type Schedule,
  type ScheduleInput,
  type TimeOffInput,
} from "./schedule";
import { dayToDate, describeDose, doseTitle, vaccineInput, type VaccineData, type VaccineInput } from "./vaccines";
import { completeRoom, doctorIdentity, ensureRoom, roomNameFor, videoReady, videoToken } from "./video";

/** Server actions for the console. Each one checks the signed-in doctor itself. */

async function signedInDoctor() {
  const doctor = await requireDoctor();
  await connectDB();
  return doctor;
}

const objectId = (id: unknown) => (typeof id === "string" && isValidObjectId(id) ? new Types.ObjectId(id) : null);

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

// ---------------------------------------------------------------------------
// Record access by OTP (layer 2)

export type AccessFormState = { error?: string; notice?: string; devCode?: string };

const WHAT = "Full record";

/** Sends the patient, or their nominee, an OTP that opens the record to this doctor for 24 hours. */
export async function requestRecordAccess(
  memberId: string,
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const doctor = await signedInDoctor();
  const member = objectId(memberId) && (await MemberModel.findById(memberId).select("name phone").lean());
  if (!member) return { error: "We couldn’t find this patient." };

  const sendTo = formData.get("sendTo") === "nominee" ? "nominee" : "patient";
  let phone = member.phone;
  let recipient = member.name.split(/\s+/)[0];
  if (sendTo === "nominee") {
    const profile = await EmergencyProfileModel.findOne({ member: member._id }).select("emergencyContacts").lean();
    const nominee = profile?.emergencyContacts?.find((c) => c.isNominee && c.phone?.trim());
    if (!nominee) return { error: "This patient hasn’t named a nominee. Send the OTP to them instead." };
    phone = nominee.phone;
    recipient = nominee.name.split(/\s+/)[0];
  }

  const now = new Date();
  const open = await AccessGrantModel.exists({ doctor: doctor._id, member: member._id, status: "active", expiresAt: { $gt: now } });
  if (open) {
    refresh();
    return { notice: "This record is already open to you." };
  }

  const pending = await AccessGrantModel.findOne({ doctor: doctor._id, member: member._id, status: "pending" }).sort({ createdAt: -1 });
  if (pending && now.getTime() - pending.updatedAt.getTime() < OTP_RESEND_MS) {
    return { error: "An OTP was sent a moment ago. Wait a few seconds before sending another." };
  }

  let sent: SentOtp;
  try {
    sent = await sendOtp(phone, "record_access");
  } catch (error) {
    if (error instanceof OtpDeliveryError) return { error: error.message };
    throw error;
  }

  // Either a hash (test mode) or Twilio's id, never both: checkOtp goes by whichever is there.
  const { codeHash, verificationSid, devCode } = sent;
  const otp = {
    ...(codeHash ? { otpHash: codeHash } : { verificationSid }),
    otpSentTo: phone,
    attempts: 0,
    expiresAt: new Date(now.getTime() + ACCESS_OTP_TTL_MS),
  };
  if (pending) {
    // updatedAt moves on, which restarts the resend wait and the "sent at" time.
    await AccessGrantModel.updateOne(
      { _id: pending._id },
      { $set: otp, $unset: codeHash ? { verificationSid: 1 } : { otpHash: 1 } },
    );
    await AccessLogModel.updateOne(
      { accessGrant: pending._id },
      { $set: { requestedAt: now, expiresAt: otp.expiresAt } },
    );
  } else {
    const grant = await AccessGrantModel.create({ doctor: doctor._id, member: member._id, status: "pending", ...otp });
    await AccessLogModel.create({
      doctor: doctor._id,
      member: member._id,
      accessGrant: grant._id,
      what: WHAT,
      status: "pending",
      requestedAt: now,
      expiresAt: otp.expiresAt,
      ip: await clientIp(),
    });
  }

  refresh();
  return { notice: `OTP sent to ${recipient}. Ask them to read it out to you.`, devCode };
}

const otpField = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP.");

/** Checks the OTP the patient or nominee read out, and opens the record if it matches. */
export async function verifyRecordAccess(
  memberId: string,
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const parsed = otpField.safeParse(formData.get("otp") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const doctor = await signedInDoctor();
  const member = objectId(memberId) && (await MemberModel.findById(memberId).select("name phone").lean());
  if (!member) return { error: "We couldn’t find this patient." };

  const now = new Date();
  const grant = await AccessGrantModel.findOne({ doctor: doctor._id, member: member._id, status: "pending" }).sort({ createdAt: -1 });
  if (!(grant?.otpHash || grant?.verificationSid) || !grant.otpSentTo || !grant.expiresAt || grant.expiresAt <= now) {
    return { error: "This OTP has expired. Send a new one." };
  }

  /** Burns the code: the next try needs a fresh OTP. */
  const burn = async (attempts: number) => {
    await AccessGrantModel.updateOne(
      { _id: grant._id },
      { $set: { attempts, expiresAt: now }, $unset: { otpHash: 1, verificationSid: 1 } },
    );
    await AccessLogModel.updateOne({ accessGrant: grant._id }, { $set: { expiresAt: now } });
    refresh();
  };

  const result = await checkOtp("record_access", grant.otpSentTo, parsed.data, grant);
  if (result === "unavailable") return { error: "We couldn’t check the OTP just now. Please try again." };
  if (result === "expired") {
    await burn(grant.attempts ?? 0);
    return { error: "This OTP has expired. Send a new one." };
  }
  if (result === "wrong") {
    const attempts = (grant.attempts ?? 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await burn(attempts);
      await cancelOtp("record_access", grant.verificationSid);
      return { error: "Too many wrong OTPs. Send a new one." };
    }
    await AccessGrantModel.updateOne({ _id: grant._id }, { $set: { attempts } });
    const left = OTP_MAX_ATTEMPTS - attempts;
    return { error: `That OTP doesn’t match. ${left} ${left === 1 ? "try" : "tries"} left.` };
  }

  let approvedBy = { role: "patient" as "patient" | "nominee", name: member.name };
  if (grant.otpSentTo !== member.phone) {
    const profile = await EmergencyProfileModel.findOne({ member: member._id }).select("emergencyContacts").lean();
    const contact = profile?.emergencyContacts?.find((c) => c.phone === grant.otpSentTo);
    approvedBy = { role: "nominee", name: contact?.name ?? "Nominee" };
  }

  const expiresAt = new Date(now.getTime() + ACCESS_TTL_MS);
  await AccessGrantModel.updateOne(
    { _id: grant._id },
    { $set: { status: "active", approvedAt: now, expiresAt }, $unset: { otpHash: 1, verificationSid: 1 } },
  );
  await AccessLogModel.updateOne(
    { accessGrant: grant._id },
    { $set: { status: "active", approvedBy, approvedAt: now, expiresAt } },
  );
  // Today's and upcoming consults with this patient now run on this grant.
  await ConsultModel.updateMany(
    { doctor: doctor._id, member: member._id, status: { $in: ["scheduled", "in_progress"] } },
    { $set: { accessGrant: grant._id } },
  );

  refresh();
  return { notice: "Record opened." };
}

// ---------------------------------------------------------------------------
// Prescriptions

const itemsField = z
  .array(z.string().trim().max(300, "Keep each line under 300 characters."))
  .transform((items) => items.filter(Boolean))
  .pipe(z.array(z.string()).max(40, "Keep it to 40 lines or fewer."));

const vaccinesField = z.array(vaccineInput).max(10, "Keep it to 10 vaccines or fewer.");

export type SavePrescriptionInput = {
  prescriptionId?: string;
  memberId: string;
  consultId?: string;
  items: string[];
  vaccines?: VaccineInput[];
  /** Lab tests from Mobilab's catalog, for the patient to book at a pod. */
  tests?: LabTestInput[];
  sign: boolean;
};

export type SavePrescriptionResult = { error?: string; id?: string; signed?: boolean };

/**
 * Saves a draft, or signs it. A new draft needs the patient's record to be open; signing writes
 * a prescription entry to the patient's timeline and nothing can be changed after that.
 */
export async function savePrescription(input: SavePrescriptionInput): Promise<SavePrescriptionResult> {
  const doctor = await signedInDoctor();
  const parsed = itemsField.safeParse(input.items);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const items = parsed.data;
  const parsedVaccines = vaccinesField.safeParse(input.vaccines ?? []);
  if (!parsedVaccines.success) {
    const issue = parsedVaccines.error.issues[0];
    const which = typeof issue.path[0] === "number" ? (input.vaccines?.[issue.path[0]]?.name?.trim() || "a vaccine") : "";
    return { error: which ? `${which}: ${issue.message}` : issue.message };
  }
  const vaccines = parsedVaccines.data;
  const parsedTests = labTestsField.safeParse(input.tests ?? []);
  if (!parsedTests.success) return { error: parsedTests.error.issues[0].message };
  const tests = parsedTests.data;
  if (items.length === 0 && vaccines.length === 0 && tests.length === 0) {
    return { error: "Add at least one medicine, test, piece of advice or vaccine." };
  }

  const memberId = objectId(input.memberId);
  if (!memberId) return { error: "We couldn’t find this patient." };

  let prescription = input.prescriptionId
    ? await PrescriptionModel.findOne({ _id: objectId(input.prescriptionId), doctor: doctor._id, member: memberId })
    : null;
  if (input.prescriptionId && !prescription) return { error: "This prescription no longer exists." };
  if (prescription?.status === "signed") return { error: "This prescription is already signed and can’t be changed." };

  if (!prescription) {
    const open = await AccessGrantModel.exists({ doctor: doctor._id, member: memberId, status: "active", expiresAt: { $gt: new Date() } });
    if (!open) return { error: "The patient’s record isn’t open to you. Ask them for an OTP first." };
  }

  const consultId = objectId(input.consultId);
  const consult = consultId ? await ConsultModel.findOne({ _id: consultId, doctor: doctor._id, member: memberId }).select("_id") : null;

  // The same allergy check the screen runs, so a stale page can't sign past it.
  const profile = await EmergencyProfileModel.findOne({ member: memberId }).select("allergies").lean();
  const vaccineLines = vaccines.map((v) => [v.name, v.brand].filter(Boolean).join(" "));
  const clash = allergyClash([...items, ...vaccineLines], allergyTerms((profile?.allergies ?? []).filter(Boolean) as string[]));
  if (input.sign && clash) return { error: `“${clash}” clashes with a recorded allergy. Change it before signing.` };

  if (prescription) {
    prescription.items = items;
    prescription.set("tests", tests);
    if (consult && !prescription.consult) prescription.consult = consult._id;
  } else {
    prescription = new PrescriptionModel({
      doctor: doctor._id,
      member: memberId,
      consult: consult?._id,
      source: "typed",
      items,
      tests,
    });
  }

  if (input.sign) {
    const now = new Date();
    const record = await HealthRecordModel.create({
      member: memberId,
      type: "prescription",
      source: "consult",
      title: `Prescription from ${/^dr\.?\s/i.test(doctor.name) ? doctor.name : `Dr ${doctor.name}`}`,
      recordedAt: now,
      provider: doctor.name,
      consult: prescription.consult ?? undefined,
    });
    prescription.status = "signed";
    prescription.signedAt = now;
    prescription.healthRecord = record._id;
    if (prescription.consult) {
      await ConsultModel.updateOne({ _id: prescription.consult, doctor: doctor._id }, { $set: { prescription: record._id } });
    }
  }
  await prescription.save();
  await replaceVaccinations({
    vaccines,
    prescriptionId: prescription._id,
    doctorId: doctor._id,
    memberId,
    consultId: prescription.consult ?? undefined,
    healthRecordId: input.sign ? prescription.healthRecord ?? undefined : undefined,
  });

  refresh();
  return { id: String(prescription._id), signed: prescription.status === "signed" };
}

/**
 * Swaps a draft's vaccines for the ones just sent. With `healthRecordId` the prescription is being
 * signed: the vaccines are scheduled and each dose gets a reminder in the patient's app.
 */
async function replaceVaccinations({
  vaccines,
  prescriptionId,
  doctorId,
  memberId,
  consultId,
  healthRecordId,
}: {
  vaccines: VaccineData[];
  prescriptionId: Types.ObjectId;
  doctorId: Types.ObjectId;
  memberId: Types.ObjectId;
  consultId?: Types.ObjectId;
  healthRecordId?: Types.ObjectId;
}) {
  await VaccinationModel.deleteMany({ prescription: prescriptionId, doctor: doctorId, status: "draft" });
  if (vaccines.length === 0) return;

  const signing = Boolean(healthRecordId);
  const rows = [];
  for (const v of vaccines) {
    const totalDoses = v.startDose + v.dates.length - 1;
    const doseText = describeDose(v);
    let reminderIds: Types.ObjectId[] = [];
    if (signing) {
      // Field for field what the app's own reminders look like, so its Care tab shows them as is.
      const reminders = await ReminderModel.insertMany(
        v.dates.map((day, i) => ({
          member: memberId,
          kind: "vaccine",
          title: doseTitle(v.name, v.startDose + i, totalDoses),
          dose: [v.brand, doseText].filter(Boolean).join(", "),
          dueAt: dayToDate(day),
          startsOn: dayToDate(day),
          prescription: healthRecordId,
          isActive: true,
        })),
      );
      reminderIds = reminders.map((r) => r._id);
    }
    rows.push({
      member: memberId,
      doctor: doctorId,
      prescription: prescriptionId,
      consult: consultId,
      name: v.name,
      brand: v.brand,
      dose: { amount: v.doseAmount, unit: v.doseUnit },
      route: v.route,
      site: v.site,
      instructions: v.instructions,
      schedule: {
        type: v.schedule,
        every: v.schedule === "recurring" ? { count: v.everyCount, unit: v.everyUnit } : undefined,
        totalDoses,
      },
      doses: v.dates.map((day, i) => ({ number: v.startDose + i, dueOn: dayToDate(day), reminder: reminderIds[i] })),
      status: signing ? "scheduled" : "draft",
    });
  }
  await VaccinationModel.insertMany(rows);
}

/** Throws away a draft that was never signed, with its vaccines. */
export async function discardPrescription(prescriptionId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(prescriptionId);
  if (id) {
    const deleted = await PrescriptionModel.deleteOne({ _id: id, doctor: doctor._id, status: "draft" });
    if (deleted.deletedCount) await VaccinationModel.deleteMany({ prescription: id, doctor: doctor._id, status: "draft" });
  }
  refresh();
}

// ---------------------------------------------------------------------------
// Consults

const VIDEO_NOT_SET_UP = "Video calls are not set up.";

/** Closes the consult's video room, which takes the member out of it. Logged, never thrown. */
async function closeRoom(consultId: string) {
  if (!videoReady()) return;
  await completeRoom(consultId).catch((error: unknown) => {
    console.error(`[video] Couldn't close the room for consult ${consultId}`, error);
  });
}

/**
 * What the browser needs to join a consult's room, or why it can't. `status` says whether to
 * wait for Admit (`scheduled`) or share camera and mic at once. `ended`: the consult is over.
 */
export type ConsultRoom =
  | { roomName: string; token: string; status: "scheduled" | "in_progress" }
  | { error: string; ended?: boolean; missed?: boolean };

/** Why a booked consult that nobody started in time can't be opened or started. */
const MISSED_MESSAGE = `This consult wasn’t started within ${LATE_START_MINUTES} minutes of its time, so it has moved to past consults.`;

/** A token for the signed-in doctor to join their own consult's room, before or during the call. */
export async function getConsultRoom(consultId: string): Promise<ConsultRoom> {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  const consult = id ? await ConsultModel.findOne({ _id: id, doctor: doctor._id }, { status: 1, scheduledAt: 1 }).lean() : null;
  if (!consult) return { error: "This consult no longer exists." };
  if (consult.status === "completed") return { error: "This consult has ended.", ended: true };
  if (consult.status !== "scheduled" && consult.status !== "in_progress") return { error: "This consult was cancelled." };
  if (isMissed(consult)) return { error: MISSED_MESSAGE, missed: true };
  if (!videoReady()) return { error: VIDEO_NOT_SET_UP };

  try {
    await ensureRoom(consultId);
  } catch (error) {
    console.error(`[video] Couldn't open the room for consult ${consultId}`, error);
    return { error: "The video room couldn’t be opened just now. Try again in a moment." };
  }
  const roomName = roomNameFor(consultId);
  return { roomName, token: videoToken(doctorIdentity(String(doctor._id)), roomName), status: consult.status };
}

/**
 * Starts the consult when the doctor admits the member. Saved before the doctor's camera and mic
 * go to the room, so a member who rejoins from now on goes straight into the call. Returns the
 * consult's status: `in_progress` means share camera and mic, even if it was already started.
 * `missed`: it wasn't started within `LATE_START_MINUTES` of its time, so it can't be any more.
 */
export async function admitPatient(consultId: string): Promise<{ status?: string; error?: string }> {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  if (!id) return {};
  const started = await ConsultModel.updateOne(
    {
      _id: id,
      doctor: doctor._id,
      status: "scheduled",
      scheduledAt: { $gt: new Date(Date.now() - LATE_START_MINUTES * 60_000) },
    },
    { $set: { status: "in_progress", startedAt: new Date() } },
  );
  if (started.modifiedCount) {
    refresh();
    return { status: "in_progress" };
  }
  const consult = await ConsultModel.findOne({ _id: id, doctor: doctor._id }, { status: 1, scheduledAt: 1 }).lean();
  if (consult && isMissed(consult)) return { status: "missed", error: MISSED_MESSAGE };
  return { status: consult?.status };
}

/** Ends a consult and closes its video room, which takes the member out of the call too. */
export async function endConsult(consultId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  if (!id) return;
  await ConsultModel.updateOne(
    { _id: id, doctor: doctor._id, status: "in_progress" },
    { $set: { status: "completed", endedAt: new Date() } },
  );
  await closeRoom(consultId);
  refresh();
}

/** What a member reads when the doctor calls off their consult. Never the doctor's private note. */
const DOCTOR_CANCEL_REASON = "The doctor isn’t available at this time. Please book another slot.";

/** Cancels one booked consult. The member sees it as cancelled by the doctor, with the reason. */
export async function cancelConsult(consultId: string, reason?: string): Promise<{ error?: string }> {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  if (!id) return { error: "This consult no longer exists." };
  const text = typeof reason === "string" ? reason.trim().replace(/\s+/g, " ") : "";
  if (text.length > 200) return { error: "Keep the reason under 200 characters." };

  // Not a missed one: the member would be told to book again for a time that has already passed.
  const result = await ConsultModel.updateOne(
    {
      _id: id,
      doctor: doctor._id,
      status: "scheduled",
      scheduledAt: { $gt: new Date(Date.now() - LATE_START_MINUTES * 60_000) },
    },
    { $set: { status: "cancelled", cancelledAt: new Date(), cancelledBy: "doctor", cancelReason: text || DOCTOR_CANCEL_REASON } },
  );
  if (!result.modifiedCount) return { error: "Only a consult that hasn’t started or been missed can be cancelled." };
  // A member in the waiting room is told at once.
  await closeRoom(consultId);
  refresh();
  return {};
}

// ---------------------------------------------------------------------------
// Consult requests: a patient asking for a time that isn't one of the open slots

/**
 * Why an approval was refused, in words for the doctor. Thrown inside the transaction to undo it.
 * `gone`: the request can't be answered any more, so it leaves the list.
 */
class RequestRefused extends Error {
  constructor(
    message: string,
    readonly gone = false,
  ) {
    super(message);
  }
}

/** An answer to a request. `gone`: it can't be answered any more and has left the list. */
export type RequestAnswer = { error?: string; gone?: boolean };

const CLASH = "You already have a consult at this time.";

/** Why a request is no longer waiting, once a change conditional on `pending` matched nothing. */
async function notPendingReason(id: Types.ObjectId, doctorId: Types.ObjectId) {
  const request = await ConsultRequestModel.findOne({ _id: id, doctor: doctorId }, { status: 1 }).lean();
  if (!request) return "This request no longer exists.";
  if (request.status === "withdrawn") return "The patient withdrew this request.";
  return "This request was already answered.";
}

/**
 * Books the time a patient asked for. Same lock as the app's booking route: both bump the
 * doctor's `bookingVersion` in a transaction, so an approval and an app booking for this doctor
 * take turns and can't overlap. The doctor's hours and time off aren't checked: approving a time
 * outside them is their choice.
 */
export async function approveConsultRequest(requestId: string): Promise<RequestAnswer> {
  const doctor = await signedInDoctor();
  const id = objectId(requestId);
  if (!id) return { error: "This request no longer exists.", gone: true };

  try {
    await ConsultModel.db.transaction(async (session) => {
      await DoctorModel.updateOne({ _id: doctor._id }, { $inc: { bookingVersion: 1 } }, { session });

      const request = await ConsultRequestModel.findOne({ _id: id, doctor: doctor._id, status: "pending" }, null, { session });
      if (!request) throw new RequestRefused(await notPendingReason(id, doctor._id), true);
      const now = new Date();
      if (request.requestedAt <= now) throw new RequestRefused("This time has already passed.", true);

      const start = request.requestedAt.getTime();
      const end = start + request.durationMinutes * 60_000;
      const consults = await ConsultModel.find({
        doctor: doctor._id,
        status: { $in: ["scheduled", "in_progress"] },
        scheduledAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      }).session(session);
      const clash = consults.some((c) => {
        const held = consultBusy(c, now);
        return held !== null && start < held.end && held.start < end;
      });
      if (clash) throw new RequestRefused(CLASH);

      const [consult] = await ConsultModel.create(
        [
          {
            member: request.member,
            doctor: doctor._id,
            specialty: request.specialty,
            scheduledAt: request.requestedAt,
            durationMinutes: request.durationMinutes,
            mode: "video",
            reason: request.reason,
          },
        ],
        { session },
      );
      await ConsultRequestModel.updateOne(
        { _id: request._id, status: "pending" },
        { $set: { status: "approved", respondedAt: new Date(), consult: consult!._id } },
        { session },
      );
    });
  } catch (error) {
    if (error instanceof RequestRefused) {
      if (error.gone) refresh();
      return { error: error.message, gone: error.gone };
    }
    // The unique index on a doctor's booked starts: an exact duplicate got there first.
    if ((error as { code?: number }).code === 11000) return { error: CLASH };
    console.error(`[requests] Couldn't approve request ${requestId}`, error);
    return { error: "Couldn’t book this just now. Try again." };
  }
  refresh();
  return {};
}

/** Turns a request down. The note, if any, is shown to the patient word for word. */
export async function declineConsultRequest(requestId: string, note?: string): Promise<RequestAnswer> {
  const doctor = await signedInDoctor();
  const id = objectId(requestId);
  if (!id) return { error: "This request no longer exists.", gone: true };
  const text = typeof note === "string" ? note.trim().replace(/\s+/g, " ") : "";
  if (text.length > 200) return { error: "Keep the note under 200 characters." };

  const result = await ConsultRequestModel.updateOne(
    { _id: id, doctor: doctor._id, status: "pending" },
    { $set: { status: "declined", respondedAt: new Date(), ...(text ? { declineReason: text } : {}) } },
  );
  refresh();
  if (!result.modifiedCount) return { error: await notPendingReason(id, doctor._id), gone: true };
  return {};
}

// ---------------------------------------------------------------------------
// Lab tests for prescriptions

/** Mobilab's tests and health checks for the "Add tests" dialog, or why they can't be listed. */
export async function loadLabCatalog(): Promise<{ catalog?: LabCatalog; error?: string }> {
  await signedInDoctor();
  if (!mobilabReady()) return { error: "The lab isn’t connected here, so its tests can’t be listed." };
  try {
    return { catalog: await labCatalog() };
  } catch (error) {
    console.error("[mobilab] Couldn't load the lab catalog:", String(error));
    return { error: "Couldn’t load the lab’s tests just now. Try again." };
  }
}

// ---------------------------------------------------------------------------
// Availability: the schedule the app books from

export type ClashChoice = "keep" | "cancel";
export type Clash = { id: string; name: string; when: string };
export type ScheduleResult = {
  errors?: string[];
  /** Booked consults the change would leave outside the doctor's hours. Nothing was saved. */
  clashes?: Clash[];
  saved?: boolean;
  cancelled?: number;
};

/** Booked consults from now on that `schedule` no longer has room for. */
async function findClashes(doctorId: Types.ObjectId, schedule: Schedule) {
  const upcoming = await ConsultModel.find({ doctor: doctorId, status: "scheduled", scheduledAt: { $gte: new Date() } })
    .sort({ scheduledAt: 1 })
    .select("member scheduledAt durationMinutes")
    .lean();
  const clashing = upcoming.filter((c) => !consultFits(schedule, c));
  const members = await MemberModel.find({ _id: { $in: clashing.map((c) => c.member) } }).select("name").lean();
  const names = new Map(members.map((m) => [String(m._id), m.name]));
  return clashing.map((c) => ({ id: String(c._id), name: names.get(String(c.member)) ?? "A patient", when: formatWhen(c.scheduledAt) }));
}

/**
 * Saves a schedule change, unless it leaves booked consults outside the new hours and the
 * doctor hasn't said what to do with them yet. Then it only reports the clashes.
 */
async function applySchedule(
  doctorId: Types.ObjectId,
  next: Schedule,
  choice: ClashChoice | undefined,
): Promise<ScheduleResult> {
  const clashes = await findClashes(doctorId, next);
  if (clashes.length && !choice) return { clashes };

  const now = new Date();
  await DoctorModel.updateOne(
    { _id: doctorId },
    {
      $set: {
        "schedule.acceptingBookings": next.acceptingBookings,
        "schedule.slotMinutes": next.slotMinutes,
        "schedule.bookingWindowDays": next.bookingWindowDays,
        "schedule.minNoticeMinutes": next.minNoticeMinutes,
        "schedule.weekly": next.weekly,
        // Past time off is dropped on every save; it no longer changes anything.
        "schedule.timeOff": next.timeOff
          .filter((t) => t.end > now)
          .slice(0, LIMITS.timeOff)
          .map(({ id, start, end, note }) => ({ ...(objectId(id) ? { _id: objectId(id) } : {}), start, end, note })),
        "schedule.updatedAt": now,
      },
    },
    { runValidators: true },
  );

  let cancelled = 0;
  if (clashes.length && choice === "cancel") {
    const result = await ConsultModel.updateMany(
      { _id: { $in: clashes.map((c) => new Types.ObjectId(c.id)) }, doctor: doctorId, status: "scheduled" },
      { $set: { status: "cancelled", cancelledAt: now, cancelledBy: "doctor", cancelReason: DOCTOR_CANCEL_REASON } },
    );
    cancelled = result.modifiedCount;
  }
  refresh();
  return { saved: true, cancelled };
}

const currentSchedule = (doctor: Awaited<ReturnType<typeof signedInDoctor>>) =>
  resolveSchedule(doctor.schedule as SavedSchedule);

const issues = (error: z.ZodError) => [...new Set(error.issues.map((issue) => issue.message))];

/** Weekly hours and booking rules. */
export async function saveWeeklySchedule(input: ScheduleInput, choice?: ClashChoice): Promise<ScheduleResult> {
  const doctor = await signedInDoctor();
  const parsed = scheduleInput.safeParse(input);
  if (!parsed.success) return { errors: issues(parsed.error) };
  return applySchedule(doctor._id, { ...currentSchedule(doctor), ...parsed.data }, choice);
}

/** Days off, part of a day off, or the rest of today. */
export async function addTimeOff(
  input: TimeOffInput | { kind: "rest_of_today" },
  choice?: ClashChoice,
): Promise<ScheduleResult> {
  const doctor = await signedInDoctor();
  const now = new Date();
  const schedule = currentSchedule(doctor);
  if (schedule.timeOff.filter((t) => t.end > now).length >= LIMITS.timeOff) {
    return { errors: [`You can have up to ${LIMITS.timeOff} upcoming time-off entries. Remove some first.`] };
  }

  let range: { start: Date; end: Date; note?: string };
  if (input.kind === "rest_of_today") {
    if (offRestOfToday(schedule.timeOff, now)) return { errors: ["You’re already off for the rest of today."] };
    range = { start: now, end: istInstant(istDateKey(now, 1), "00:00") };
  } else {
    const parsed = timeOffInput.safeParse(input);
    if (!parsed.success) return { errors: issues(parsed.error) };
    const result = timeOffRange(parsed.data, now);
    if (result.error) return { errors: [result.error] };
    range = result.range!;
  }
  return applySchedule(doctor._id, { ...schedule, timeOff: [...schedule.timeOff, range] }, choice);
}

/** Taking time off back frees the time again; it can't clash with anything. */
export async function removeTimeOff(timeOffId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(timeOffId);
  if (!id) return;
  await DoctorModel.updateOne({ _id: doctor._id }, { $pull: { "schedule.timeOff": { _id: id } } });
  refresh();
}

// ---------------------------------------------------------------------------
// Results

/** Moves a pod booking's results off the "new" list once the doctor has looked at them. */
export async function markResultReviewed(bookingId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(bookingId);
  if (!id) return;
  const booking = await BookingModel.findOne({ _id: id, result: { $exists: true } })
    .select("member profiles tests createdAt")
    .lean();
  if (!booking || !(await isResultsPatient(doctor._id, booking.member))) return;
  const tests = booking.tests?.length ?? 0;
  await TestOrderModel.updateOne(
    { doctor: doctor._id, booking: booking._id },
    {
      $set: { status: "reviewed", reviewedAt: new Date() },
      $setOnInsert: {
        member: booking.member,
        test: booking.profiles?.length ? booking.profiles.join(", ") : `${tests} test${tests === 1 ? "" : "s"}`,
        orderedAt: booking.createdAt,
      },
    },
    { upsert: true },
  );
  refresh();
}

// ---------------------------------------------------------------------------
// Settings and notifications

export async function updateSetting(group: SettingGroup, key: string, on: boolean) {
  const doctor = await signedInDoctor();
  if (!(group in DEFAULT_SETTINGS) || !(key in DEFAULT_SETTINGS[group]) || typeof on !== "boolean") return;
  await DoctorModel.updateOne({ _id: doctor._id }, { $set: { [`settings.${group}.${key}`]: on } });
  refresh();
}

/**
 * The doctor has Notifications open: everything up to `upTo` (when that list was read) is seen,
 * so the bell's dot goes. Never moves back, and never past now.
 */
export async function markNotificationsSeen(upTo: string) {
  const doctor = await signedInDoctor();
  const at = new Date(upTo);
  if (Number.isNaN(at.getTime())) return;
  const seen = new Date(Math.min(at.getTime(), Date.now()));
  await DoctorModel.updateOne({ _id: doctor._id }, { $max: { "settings.notificationsSeenAt": seen } });
  refresh();
}
