import { Schema, model, models, type InferSchemaType } from "mongoose";

import { ACCESS_APPROVERS, ACCESS_STATUSES } from "./constants";

/**
 * One row per record a doctor asked for or opened. The member sees the same
 * entries in their app. The OTP itself lives on the AccessGrant, never here.
 */
const accessLogSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    accessGrant: { type: Schema.Types.ObjectId, ref: "AccessGrant" },
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },

    /** What was asked for or opened, e.g. "Full record, Ekaay summary". */
    what: { type: String, required: true },
    status: { type: String, enum: ACCESS_STATUSES, default: "pending" },

    requestedAt: { type: Date, default: Date.now },
    /** Empty while the request is still waiting for an OTP. */
    approvedBy: {
      role: { type: String, enum: ACCESS_APPROVERS },
      name: String,
    },
    approvedAt: Date,
    expiresAt: Date,
    revokedAt: Date,
    ip: String,
  },
  { timestamps: true },
);

accessLogSchema.index({ doctor: 1, requestedAt: -1 });
accessLogSchema.index({ member: 1, requestedAt: -1 });

export type AccessLog = InferSchemaType<typeof accessLogSchema>;

const build = () => model("AccessLog", accessLogSchema);
export const AccessLogModel = (models.AccessLog as ReturnType<typeof build>) ?? build();
