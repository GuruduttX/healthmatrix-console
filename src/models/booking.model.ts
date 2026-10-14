import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

import { BOOKING_STATUSES } from "./constants";

/**
 * Tests booked at a pod. The member app creates them (healthmatrix-app
 * `src/server/models/booking.model.ts`; fields kept as they are there): Mobilab puts the booking
 * in the pod's queue with no time, and the member is tested whenever they arrive. The console
 * updates the Mobilab status and files the results (`src/lib/pod-bookings.ts`).
 */
const bookingSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    /** The pod as it was when booked: its Mobilab clinic id and name. */
    pod: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    /** Health checks booked, by name, for showing the booking. */
    profiles: { type: [String], default: [] },
    /** Every test code the booking covers, the checks' tests included. */
    tests: { type: [String], required: true },
    /** The sex sent to the lab for its reference ranges: Mobilab takes male or female only. */
    sex: { type: String, enum: ["male", "female"], required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "booked" },

    /** Mobilab's side. `bookingId` is our reference, sent on creation and used by its webhook. */
    mobilab: {
      bookingId: { type: String, required: true, unique: true },
      id: String,
      /** Mobilab's lifecycle: pending, in_progress, … report_generated (see `src/lib/pod-bookings.ts`). */
      status: String,
      /** When the status was last asked for, so screens don't ask on every load. */
      checkedAt: Date,
    },

    /** Set when a doctor ordered the tests, so results flow back to them. */
    orderedByConsult: { type: Schema.Types.ObjectId, ref: "Consult" },
    result: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
  },
  { timestamps: true },
);

bookingSchema.index({ member: 1, createdAt: -1 });

export type Booking = InferSchemaType<typeof bookingSchema>;

// Rebuilt on each run: the console writes bookings, and a hot reload must not keep an older
// schema that would drop the newer fields.
if (models.Booking) deleteModel("Booking");
export const BookingModel = model("Booking", bookingSchema);
