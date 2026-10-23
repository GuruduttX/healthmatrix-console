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
    /** The OTP's hash when it was made here (test mode); Twilio keeps its own codes. */
    otpHash: String,
    /** Twilio Verify's id for the OTP (VE…), when Twilio sent it. Added by the console. */
    verificationSid: String,
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

// Rebuilt on every load in development so a hot reload never keeps an older schema; reused in
// production. See doctor.model.ts.
if (models.AccessGrant && process.env.NODE_ENV !== "production") deleteModel("AccessGrant");
const build = () => model("AccessGrant", accessGrantSchema);
export const AccessGrantModel = (models.AccessGrant as ReturnType<typeof build>) ?? build();
