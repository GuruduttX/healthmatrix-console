import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

import { ACCESS_STATUSES } from "./constants";

/**
 * Full-record access (layer 2): a doctor asks, the member or their nominee
 * approves with an OTP, and the grant expires on its own.
 */
const accessGrantSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },

    status: { type: String, enum: ACCESS_STATUSES, default: "pending" },
    otpHash: String,
    /** The phone the OTP went to: the member's or their nominee's. */
    otpSentTo: String,
    /** Wrong OTPs entered. Added by the console; the app's schema doesn't have it. */
    attempts: { type: Number, default: 0 },
    approvedAt: Date,
    expiresAt: Date,
    revokedAt: Date,

    /** Every view is logged so the member can see who opened what, when. */
    views: [{ at: { type: Date, default: Date.now }, ip: String, what: String }],
  },
  { timestamps: true },
);

accessGrantSchema.index({ member: 1, createdAt: -1 });
accessGrantSchema.index({ doctor: 1, status: 1 });

export type AccessGrant = InferSchemaType<typeof accessGrantSchema>;

// Rebuilt on every load so a hot reload never keeps an older schema; see doctor.model.ts.
if (models.AccessGrant) deleteModel("AccessGrant");
export const AccessGrantModel = model("AccessGrant", accessGrantSchema);
