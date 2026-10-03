import { Schema, model, models, type InferSchemaType } from "mongoose";

import { READING_FLAGS, TEST_ORDER_STATUSES } from "./constants";

/**
 * A test the doctor ordered. The member books it at a pod, and the result comes
 * back to the doctor's Results page until they mark it reviewed.
 */
const testOrderSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },
    prescription: { type: Schema.Types.ObjectId, ref: "Prescription" },

    test: { type: String, required: true, trim: true }, // "Complete blood count"
    code: String, // stable key, e.g. "hba1c", as in Booking.tests
    orderedAt: { type: Date, default: Date.now },
    status: { type: String, enum: TEST_ORDER_STATUSES, default: "awaiting_booking" },

    /** The pod slot, once the member books one. */
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    /** Where the test is done when it is not a pod booking, e.g. "City lab". */
    provider: String,

    result: {
      /** The headline value, e.g. "Haemoglobin 11.4 g/dL". */
      summary: String,
      flag: { type: String, enum: READING_FLAGS },
      /** How the flag reads for this test, e.g. "Above target". */
      label: String,
      resultedAt: Date,
      /** The full report on the member's timeline. */
      healthRecord: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

testOrderSchema.index({ doctor: 1, status: 1, orderedAt: -1 });
testOrderSchema.index({ member: 1, orderedAt: -1 });

export type TestOrder = InferSchemaType<typeof testOrderSchema>;

const build = () => model("TestOrder", testOrderSchema);
export const TestOrderModel = (models.TestOrder as ReturnType<typeof build>) ?? build();
