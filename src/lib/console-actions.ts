"use server";

import { timingSafeEqual } from "node:crypto";

import { isValidObjectId, Types } from "mongoose";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import {
  AccessGrantModel,
  AccessLogModel,
  ConsultModel,
  DoctorModel,
  EmergencyProfileModel,
  HealthRecordModel,
  MemberModel,
  PrescriptionModel,
  ReminderModel,
  TestOrderModel,
  VaccinationModel,
} from "@/models";

import { generateOtp, hashOtp, OTP_MAX_ATTEMPTS, OTP_RESEND_MS, requireDoctor } from "./auth";
import { ACCESS_OTP_TTL_MS, ACCESS_TTL_MS, DEFAULT_SETTINGS, type SettingGroup } from "./console-data";
import { connectDB } from "./db";
import { OtpDeliveryError, sendOtp } from "./otp-sender";
import { allergyClash, allergyTerms } from "./patient-text";
import { dayToDate, describeDose, doseTitle, vaccineInput, type VaccineData, type VaccineInput } from "./vaccines";

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

  const code = generateOtp();
  let devCode: string | undefined;
  try {
    ({ devCode } = await sendOtp(phone, code, "record_access"));
  } catch (error) {
    if (error instanceof OtpDeliveryError) return { error: error.message };
    throw error;
  }

  const otp = { otpHash: hashOtp(phone, code), otpSentTo: phone, attempts: 0, expiresAt: new Date(now.getTime() + ACCESS_OTP_TTL_MS) };
  if (pending) {
    // updatedAt moves on, which restarts the resend wait and the "sent at" time.
    await AccessGrantModel.updateOne({ _id: pending._id }, { $set: otp });
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
  if (!grant?.otpHash || !grant.otpSentTo || !grant.expiresAt || grant.expiresAt <= now) {
    return { error: "This OTP has expired. Send a new one." };
  }

  const expected = Buffer.from(grant.otpHash, "hex");
  const actual = Buffer.from(hashOtp(grant.otpSentTo, parsed.data), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attempts = (grant.attempts ?? 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      // Burn the code: the next try needs a fresh OTP.
      await AccessGrantModel.updateOne({ _id: grant._id }, { $set: { attempts, expiresAt: now }, $unset: { otpHash: 1 } });
      await AccessLogModel.updateOne({ accessGrant: grant._id }, { $set: { expiresAt: now } });
      refresh();
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
    { $set: { status: "active", approvedAt: now, expiresAt }, $unset: { otpHash: 1 } },
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
  if (items.length === 0 && vaccines.length === 0) {
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
    if (consult && !prescription.consult) prescription.consult = consult._id;
  } else {
    prescription = new PrescriptionModel({
      doctor: doctor._id,
      member: memberId,
      consult: consult?._id,
      source: "typed",
      items,
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

/** Marks a consult as started. The video call itself isn't connected yet. */
export async function startConsult(consultId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  if (!id) return;
  await ConsultModel.updateOne(
    { _id: id, doctor: doctor._id, status: "scheduled" },
    { $set: { status: "in_progress", startedAt: new Date() } },
  );
  refresh();
}

export async function endConsult(consultId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(consultId);
  if (!id) return;
  await ConsultModel.updateOne(
    { _id: id, doctor: doctor._id, status: "in_progress" },
    { $set: { status: "completed", endedAt: new Date() } },
  );
  refresh();
}

// ---------------------------------------------------------------------------
// Results

/** Moves a result off the "new" list once the doctor has looked at it. */
export async function markResultReviewed(orderId: string) {
  const doctor = await signedInDoctor();
  const id = objectId(orderId);
  if (!id) return;
  await TestOrderModel.updateOne(
    { _id: id, doctor: doctor._id, status: "result_back" },
    { $set: { status: "reviewed", reviewedAt: new Date() } },
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

export async function markNotificationsRead() {
  const doctor = await signedInDoctor();
  await DoctorModel.updateOne({ _id: doctor._id }, { $set: { "settings.notificationsSeenAt": new Date() } });
  refresh();
}
