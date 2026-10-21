import { Schema, model, models, type InferSchemaType } from "mongoose";

import { TEST_ORDER_STATUSES } from "./constants";

/**
 * A doctor's review of a pod booking's results. The Results page lists the bookings of the
 * doctor's patients straight from `bookings` (`getTestOrders` in `src/lib/console-data.ts`); one of
 * these is written when the doctor marks a booking's results reviewed, which takes it off
 * "New results". One per doctor and booking.
 */
const testOrderSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },

    /** The booking's tests when reviewed, e.g. "Liver Function Test". */
    test: { type: String, required: true, trim: true },
    /** When the tests were booked. */
    orderedAt: { type: Date, default: Date.now },
    status: { type: String, enum: TEST_ORDER_STATUSES, default: "awaiting_booking" },
    reviewedAt: Date,
  },
  { timestamps: true },
);

testOrderSchema.index({ doctor: 1, status: 1, orderedAt: -1 });
testOrderSchema.index({ member: 1, orderedAt: -1 });

export type TestOrder = InferSchemaType<typeof testOrderSchema>;

const build = () => model("TestOrder", testOrderSchema);
export const TestOrderModel = (models.TestOrder as ReturnType<typeof build>) ?? build();
