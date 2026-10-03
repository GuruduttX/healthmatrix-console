import { Schema, model, models, type InferSchemaType } from "mongoose";

import { BOOKING_STATUSES } from "./constants";

/** A slot booked at a pod for specific tests. */
const bookingSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    pod: { type: Schema.Types.ObjectId, ref: "Pod", required: true },
    tests: { type: [String], required: true }, // ["hba1c"]
    slotAt: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "booked" },

    /** Set when a doctor ordered the tests, so results flow back to them. */
    orderedByConsult: { type: Schema.Types.ObjectId, ref: "Consult" },
    result: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
  },
  { timestamps: true },
);

bookingSchema.index({ member: 1, slotAt: -1 });
bookingSchema.index({ pod: 1, slotAt: 1 });

export type Booking = InferSchemaType<typeof bookingSchema>;

const build = () => model("Booking", bookingSchema);
export const BookingModel = (models.Booking as ReturnType<typeof build>) ?? build();
