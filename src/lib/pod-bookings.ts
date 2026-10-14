import type { HydratedDocument, Types } from "mongoose";

import { BookingModel, HealthRecordModel, type Booking } from "@/models";

import { screeningTitle, screeningValues } from "./lab-results";
import { findMobilabBooking, getMobilabResults, mobilabReady } from "./mobilab";
import type { Tone } from "./types";

/**
 * Pod bookings the member made in the app, brought up to date from Mobilab when a doctor opens
 * the patient. Ported from healthmatrix-app `src/server/pod-bookings.ts`, which does the same when
 * the member opens their bookings: whichever side looks first files the results, once (the
 * record's unique `booking` index settles a race). Keep the two in step.
 */

type BookingDoc = Booking & { _id: Types.ObjectId; createdAt: Date };

/** How often a booking's status is asked for while it waits; the webhook will replace this. */
const CHECK_EVERY_MS = 60_000;

/** Whole years between the date of birth and `on`. */
function yearsOld(dateOfBirth: Date, on: Date) {
  return Math.floor((on.getTime() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Files a booking's results as a pod screening record, dated when the lab made the report.
 * Safe to call twice: one record per booking.
 */
async function fileResults(booking: HydratedDocument<BookingDoc>, reportedAt: Date, dateOfBirth?: Date | null) {
  const results = await getMobilabResults(booking.mobilab!.bookingId);
  const values = screeningValues(results, booking.sex, dateOfBirth ? yearsOld(dateOfBirth, reportedAt) : undefined);

  try {
    const record = await HealthRecordModel.create({
      member: booking.member,
      type: "pod_screening",
      source: "pod",
      title: screeningTitle(booking.profiles, values),
      recordedAt: reportedAt,
      provider: booking.pod?.name,
      values,
      booking: booking._id,
      remarks: results.remarks?.trim() || undefined,
      disclaimers: results.disclaimers?.length ? results.disclaimers : undefined,
      isSample: results.is_test_mode || undefined,
    });
    booking.result = record._id;
  } catch (error) {
    // The app (or another doctor) filed it first.
    if ((error as { code?: number }).code !== 11000) throw error;
    const existing = await HealthRecordModel.findOne({ booking: booking._id }).select("_id").lean();
    booking.result = existing?._id;
  }
  booking.status = "completed";
}

/** Asks Mobilab where one booking is, and files its results once the report is out. */
async function syncBooking(booking: HydratedDocument<BookingDoc>, dateOfBirth?: Date | null) {
  const found = await findMobilabBooking(booking.mobilab!.bookingId);
  booking.mobilab!.checkedAt = new Date();
  if (found) booking.mobilab!.status = found.status;

  if (found?.status === "report_generated" && !booking.result) {
    const modified = found.modified ? new Date(found.modified) : null;
    const reportedAt = modified && !Number.isNaN(modified.getTime()) ? modified : new Date();
    await fileResults(booking, reportedAt, dateOfBirth);
  } else if (found?.status === "rejected") {
    booking.status = "cancelled";
  }
  await booking.save();
}

/**
 * Brings the member's open bookings up to date, at most once a minute each. A booking that can't
 * be checked keeps its last known status; the others still update. Returns the ids of the ones
 * that couldn't be checked.
 */
export async function syncMemberBookings(member: { _id: Types.ObjectId; dateOfBirth?: Date | null }) {
  const failed = new Set<string>();
  if (!mobilabReady()) return failed;

  const due = await BookingModel.find({
    member: member._id,
    status: "booked",
    "mobilab.bookingId": { $exists: true },
    $or: [
      { "mobilab.checkedAt": { $exists: false } },
      { "mobilab.checkedAt": { $lt: new Date(Date.now() - CHECK_EVERY_MS) } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(20);

  await Promise.all(
    due.map((booking) =>
      syncBooking(booking as HydratedDocument<BookingDoc>, member.dateOfBirth).catch((error) => {
        console.error(`[pod-bookings] sync ${booking.mobilab?.bookingId} failed:`, String(error));
        failed.add(String(booking._id));
      }),
    ),
  );
  return failed;
}

/** Where a booking is, worded for the doctor. `note` says why the report isn't there yet. */
export function stageOf(status?: string | null): { label: string; tone: Tone; note?: string; ready: boolean } {
  switch (status) {
    case "report_generated":
      return { label: "Report ready", tone: "success", ready: true };
    case "in_progress":
      return { label: "Testing", tone: "neutral", note: "Report not ready yet: the sample is taken and the tests are running.", ready: false };
    case "completed":
    case "in_review":
    case "review_completed":
      return { label: "In review", tone: "neutral", note: "Report not ready yet: the lab is checking the results.", ready: false };
    case "retest_required":
      return { label: "Retest needed", tone: "warning", note: "The lab needs a new sample for some of the tests.", ready: false };
    case "rejected":
      return { label: "Cancelled", tone: "danger", note: "The pod cancelled this booking.", ready: false };
    case "archived":
      return { label: "Closed", tone: "neutral", note: "The lab closed this booking without a report.", ready: false };
    default:
      return { label: "Not tested yet", tone: "neutral", note: "Report not ready yet: waiting for the patient at the pod.", ready: false };
  }
}
