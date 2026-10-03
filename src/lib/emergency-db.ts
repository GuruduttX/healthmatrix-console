import { isValidObjectId, type Types } from "mongoose";

import {
  EMERGENCY_FIELDS,
  EmergencyProfileModel,
  MemberModel,
  QrLinkModel,
  ScanLogModel,
} from "@/models";

import { connectDB } from "./db";
import type { EmergencyProfileView } from "./emergency";
import type { BloodGroup } from "./types";

/**
 * Database side of the public emergency view (layer 1). Server code only.
 * Reads what `healthmatrix-app` stores; the one write is a row in `scanlogs`.
 */

type EmergencyField = (typeof EMERGENCY_FIELDS)[number];

function ageOn(dateOfBirth: Date, today = new Date()) {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const birthdayPassed =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

/** Drops blank entries; `undefined` when nothing is left, so the field is hidden rather than shown as "none". */
function nonEmpty(items: (string | null | undefined)[] | null | undefined) {
  const kept = (items ?? []).map((item) => item?.trim() ?? "").filter(Boolean);
  return kept.length ? kept : undefined;
}

/** The QR link behind an active code. Unknown and revoked codes both return `null`. */
async function findActiveLink(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  await connectDB();
  return QrLinkModel.findOne({ code, status: "active" }).lean();
}

/** Which fields the member shows. With no profile saved yet, every field is shown. */
async function visibleFieldsOf(memberId: Types.ObjectId) {
  const profile = await EmergencyProfileModel.findOne({ member: memberId }).lean();
  const visible = new Set<string>(profile?.visibleFields ?? EMERGENCY_FIELDS);
  return { profile, shows: (field: EmergencyField) => visible.has(field) };
}

/**
 * Finds an active QR code and builds what a stranger may see. Unknown and
 * revoked codes, and links to a deleted member, all return `undefined`.
 */
export async function findEmergencyProfile(rawCode: string) {
  const qrLink = await findActiveLink(rawCode);
  if (!qrLink) return undefined;

  const member = await MemberModel.findById(qrLink.member)
    .select("name gender dateOfBirth bloodGroup photoKey")
    .lean();
  if (!member) return undefined;

  const { profile, shows } = await visibleFieldsOf(member._id);

  const contacts = shows("emergencyContacts")
    ? (profile?.emergencyContacts ?? [])
        .filter((contact) => contact.name?.trim() && contact.phone?.trim())
        // Never pass on `isNominee`: who receives the OTP is not the finder's business.
        .map(({ name, relation, phone }) => ({
          name: name.trim(),
          relation: relation?.trim() || undefined,
          phone,
        }))
    : [];
  const insurer = profile?.insurance?.provider?.trim();

  const view: EmergencyProfileView = {
    member: {
      name: member.name,
      firstName: member.name.trim().split(/\s+/)[0],
      initials: initialsOf(member.name),
      age: member.dateOfBirth ? ageOn(member.dateOfBirth) : undefined,
      gender: member.gender ?? undefined,
      hasPhoto: shows("photo") && Boolean(member.photoKey),
    },
    bloodGroup: shows("bloodGroup") ? ((member.bloodGroup as BloodGroup) ?? undefined) : undefined,
    allergies: shows("allergies") ? nonEmpty(profile?.allergies) : undefined,
    conditions: shows("conditions") ? nonEmpty(profile?.conditions) : undefined,
    medicines: shows("medicines") ? nonEmpty(profile?.medicines) : undefined,
    emergencyContacts: contacts.length ? contacts : undefined,
    organDonor:
      shows("organDonor") && typeof profile?.organDonor === "boolean"
        ? profile.organDonor
        : undefined,
    insurance:
      shows("insurance") && insurer
        ? {
            provider: insurer,
            policyNumber: profile?.insurance?.policyNumber?.trim() || undefined,
          }
        : undefined,
  };

  return { view, qrLinkId: qrLink._id, memberId: member._id };
}

/** The member's photo bytes for an active code, or `undefined` if hidden or missing. */
export async function findEmergencyPhoto(rawCode: string) {
  const qrLink = await findActiveLink(rawCode);
  if (!qrLink) return undefined;

  const member = await MemberModel.findById(qrLink.member)
    .select("+photoData +photoMimeType")
    .lean();
  if (!member?.photoData) return undefined;

  const { shows } = await visibleFieldsOf(member._id);
  if (!shows("photo")) return undefined;

  // Lean reads hand back the BSON `Binary` wrapper rather than a Buffer.
  const data = member.photoData as unknown as Buffer | { buffer: Uint8Array };
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data.buffer);
  if (!bytes.length) return undefined;

  return { bytes, mimeType: member.photoMimeType || "image/jpeg" };
}

export type ScanLocation = { latitude: number; longitude: number };

/** Logs one scan. Fields that are unknown are left out of the row rather than stored as null. */
export async function logScan(input: {
  qrLinkId: Types.ObjectId;
  memberId: Types.ObjectId;
  location?: ScanLocation;
  ip?: string;
  userAgent?: string;
}) {
  await connectDB();
  const now = new Date();
  // Straight to the collection, so Mongoose defaults (an empty `alertedContacts`) stay out of the row.
  const result = await ScanLogModel.collection.insertOne({
    member: input.memberId,
    qrLink: input.qrLinkId,
    scannedAt: now,
    // GeoJSON stores longitude first.
    ...(input.location && {
      location: { type: "Point", coordinates: [input.location.longitude, input.location.latitude] },
    }),
    ...(input.ip && { ip: input.ip }),
    ...(input.userAgent && { userAgent: input.userAgent }),
    createdAt: now,
    updatedAt: now,
  });
  return { scanId: String(result.insertedId), scannedAt: now };
}

/** Adds the finder's location to a scan that was logged before they allowed it. */
export async function addScanLocation(
  scanId: string,
  qrLinkId: Types.ObjectId,
  location: ScanLocation,
) {
  if (!isValidObjectId(scanId)) return false;
  await connectDB();
  // Only the first location counts, and only for a scan of this same code.
  const result = await ScanLogModel.updateOne(
    { _id: scanId, qrLink: qrLinkId, "location.coordinates": { $exists: false } },
    { $set: { location: { type: "Point", coordinates: [location.longitude, location.latitude] } } },
  );
  return result.modifiedCount === 1;
}

/** Reads `{ latitude, longitude }` from a request body, or `undefined` if it isn't a real point. */
export function parseLocation(body: unknown): ScanLocation | undefined {
  const location = (body as { location?: unknown } | null)?.location;
  if (!location || typeof location !== "object") return undefined;
  const { latitude, longitude } = location as Record<string, unknown>;
  if (typeof latitude !== "number" || typeof longitude !== "number") return undefined;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { latitude, longitude };
}

/** The client's IP as the hosting proxy reports it: the first entry of `x-forwarded-for`. */
export function clientIp(source: Headers | Request) {
  const headers = source instanceof Headers ? source : source.headers;
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}
