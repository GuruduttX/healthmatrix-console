import { Schema, model, models, type InferSchemaType } from "mongoose";

import { CONSULT_MODES, CONSULT_STATUSES, SPECIALTIES } from "./constants";

/**
 * A video consult, and one row on the doctor's schedule. Shares the `consults`
 * collection with `healthmatrix-app/server`: its fields are kept as they are there,
 * and `mode`, `reason`, `startedAt` and `endedAt` are added for the console.
 */
const consultSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    specialty: { type: String, enum: SPECIALTIES, default: "general_medicine" },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: CONSULT_STATUSES, default: "scheduled" },

    mode: { type: String, enum: CONSULT_MODES, default: "video" },
    /** Why the member asked for the consult, in a line. */
    reason: { type: String, trim: true },
    /** Set when the consult is taken from inside a pod. */
    pod: { type: Schema.Types.ObjectId, ref: "Pod" },
    startedAt: Date,
    endedAt: Date,

    accessGrant: { type: Schema.Types.ObjectId, ref: "AccessGrant" },
    /** Ekaay's one-page summary, ready before the consult starts. */
    ekaaySummary: String,
    prescription: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
  },
  { timestamps: true },
);

consultSchema.index({ member: 1, scheduledAt: -1 });
consultSchema.index({ doctor: 1, scheduledAt: 1 });

export type Consult = InferSchemaType<typeof consultSchema>;

// Next.js re-evaluates this module on hot reload; reuse the compiled model when it exists.
const build = () => model("Consult", consultSchema);
export const ConsultModel = (models.Consult as ReturnType<typeof build>) ?? build();
