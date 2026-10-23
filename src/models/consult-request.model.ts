import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

import { SPECIALTIES } from "./constants";

export const CONSULT_REQUEST_STATUSES = ["pending", "approved", "declined", "withdrawn"] as const;

/**
 * A member asking for a consult at a time that isn't one of the open slots. Created by
 * healthmatrix-app, which shares the `consultrequests` collection; its fields are mirrored here.
 * Only the console moves a request from `pending` to `approved` or `declined`; the app only
 * creates requests and withdraws them. Every change is conditional on `status: "pending"`, so a
 * doctor answering and a member withdrawing at once can't both win. Nothing holds the doctor's
 * time until approval creates the consult. A pending request whose time has passed is expired.
 */
const consultRequestSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    specialty: { type: String, enum: SPECIALTIES, default: "general_medicine" },
    /** The start asked for, always on a 5-minute mark. */
    requestedAt: { type: Date, required: true },
    /** The doctor's consult length when the member asked. */
    durationMinutes: { type: Number, required: true },
    /** What the member wants to discuss. */
    reason: String,
    status: { type: String, enum: CONSULT_REQUEST_STATUSES, default: "pending" },
    /** When the doctor answered, or the member withdrew. */
    respondedAt: Date,
    /** The doctor's note when declining, shown to the member word for word. */
    declineReason: String,
    /** The consult created on approval. */
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },
  },
  { timestamps: true },
);

consultRequestSchema.index({ doctor: 1, status: 1, requestedAt: 1 });

export type ConsultRequest = InferSchemaType<typeof consultRequestSchema>;

// Rebuilt on each run in development, like the other models, so a hot reload never keeps an older
// schema. Reused in production; see doctor.model.ts.
if (models.ConsultRequest && process.env.NODE_ENV !== "production") deleteModel("ConsultRequest");
const build = () => model("ConsultRequest", consultRequestSchema);
export const ConsultRequestModel = (models.ConsultRequest as ReturnType<typeof build>) ?? build();
