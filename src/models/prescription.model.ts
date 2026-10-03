import { Schema, model, models, type InferSchemaType } from "mongoose";

import { PRESCRIPTION_SOURCES, PRESCRIPTION_STATUSES } from "./constants";

/**
 * A prescription the doctor is drafting or has signed. Ekaay drafts it from a voice
 * note or a photo; nothing reaches the member until it is signed. Signing writes a
 * HealthRecord to the member's timeline, linked here as `healthRecord`.
 */
const prescriptionSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },

    status: { type: String, enum: PRESCRIPTION_STATUSES, default: "draft" },
    source: { type: String, enum: PRESCRIPTION_SOURCES, required: true },
    /** The voice note or photo the draft was made from. */
    sourceFile: { url: String, mimeType: String },

    /** One line each: a medicine, a test or advice. */
    items: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (items: string[]) => items.length > 0,
        message: "A prescription needs at least one item.",
      },
    },

    signedAt: Date,
    /** The timeline entry created in the member's locker on signing. */
    healthRecord: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
  },
  { timestamps: true },
);

prescriptionSchema.index({ doctor: 1, status: 1, createdAt: -1 });
prescriptionSchema.index({ member: 1, createdAt: -1 });

export type Prescription = InferSchemaType<typeof prescriptionSchema>;

const build = () => model("Prescription", prescriptionSchema);
export const PrescriptionModel = (models.Prescription as ReturnType<typeof build>) ?? build();
