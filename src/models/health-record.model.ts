import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

import { READING_FLAGS, RECORD_SOURCES, RECORD_TYPES } from "./constants";

const valueSchema = new Schema(
  {
    name: { type: String, required: true }, // "LDL cholesterol"
    code: String, // stable key for trends, e.g. "ldl"
    value: { type: Number, required: true },
    unit: String,
    referenceRange: { low: Number, high: Number, text: String },
    flag: { type: String, enum: READING_FLAGS },
    /** How it was measured, e.g. "GOD-POD". */
    method: String,
    /** The health check it was booked under, e.g. "Liver Function Test"; unset for a single test. */
    group: String,
  },
  { _id: false },
);

/**
 * One entry on the records timeline: pod result, lab PDF, prescription or vaccine. Shares the
 * `healthrecords` collection with healthmatrix-app; fields are kept as they are there.
 */
const healthRecordSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    type: { type: String, enum: RECORD_TYPES, required: true },
    source: { type: String, enum: RECORD_SOURCES, required: true },
    title: { type: String, required: true },
    recordedAt: { type: Date, required: true },

    /** Where it came from: pod name, lab, or doctor. */
    provider: String,
    pod: { type: Schema.Types.ObjectId, ref: "Pod" },
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },

    files: [{ url: String, mimeType: String, pages: Number }],
    values: [valueSchema],

    /** A pod screening's booking; its Mobilab reference fetches the PDF report on demand. */
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    /** The pathologist's remarks and the lab report's disclaimers. */
    remarks: String,
    disclaimers: { type: [String], default: undefined },
    /** Made by a Mobilab test-mode key: synthetic values, never a real reading. */
    isSample: Boolean,

    /** Ekaay's plain-language note on this record. */
    ekaayNote: String,
  },
  { timestamps: true },
);

healthRecordSchema.index({ member: 1, recordedAt: -1 });
// One record per pod booking, however many times the app and the console both try to file it.
healthRecordSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { booking: { $exists: true } } });
healthRecordSchema.index({ member: 1, "values.code": 1, recordedAt: 1 });

export type HealthRecord = InferSchemaType<typeof healthRecordSchema>;

// Rebuilt on each run: the console files pod screenings, and a hot reload must not keep an older
// schema that would drop the newer fields.
if (models.HealthRecord) deleteModel("HealthRecord");
export const HealthRecordModel = model("HealthRecord", healthRecordSchema);
