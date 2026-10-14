import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

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

    /**
     * One line each: a medicine, a test or advice. Empty when the prescription is only vaccines
     * (which live in `vaccinations`) or lab tests; the console checks there is at least one thing.
     */
    items: [{ type: String, trim: true }],

    /**
     * Lab tests picked from Mobilab's catalog (`src/lib/lab-tests.ts`), for the patient to book at
     * a pod: a health check (`profile`) or a single test, with the codes a booking sends.
     */
    tests: [
      {
        _id: false,
        kind: { type: String, enum: ["profile", "test"], required: true },
        /** A test's code ("HBA1C"), or a health check's code, or `profile-<id>` when it has none. */
        code: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        /** The test codes it covers: its own for a single test, all of a health check's. */
        tests: { type: [String], default: undefined },
      },
    ],

    signedAt: Date,
    /** The timeline entry created in the member's locker on signing. */
    healthRecord: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
  },
  { timestamps: true },
);

prescriptionSchema.index({ doctor: 1, status: 1, createdAt: -1 });
prescriptionSchema.index({ member: 1, createdAt: -1 });

export type Prescription = InferSchemaType<typeof prescriptionSchema>;

// Rebuilt on every load so a hot reload never keeps an older schema; see doctor.model.ts.
if (models.Prescription) deleteModel("Prescription");
export const PrescriptionModel = model("Prescription", prescriptionSchema);
