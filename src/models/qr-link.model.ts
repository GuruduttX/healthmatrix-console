import { Schema, model, models, type InferSchemaType } from "mongoose";

import { QR_CARRIERS, QR_STATUSES } from "./constants";

/**
 * The QR holds no medical data, only this revocable code (`/e/<code>`).
 * Revoking it kills every printed copy.
 */
const qrLinkSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    code: { type: String, required: true, unique: true },
    carrier: { type: String, enum: QR_CARRIERS, default: "card" },
    status: { type: String, enum: QR_STATUSES, default: "active" },
    revokedAt: Date,
  },
  { timestamps: true },
);

export type QrLink = InferSchemaType<typeof qrLinkSchema>;

const build = () => model("QrLink", qrLinkSchema, "qrlinks");
export const QrLinkModel = (models.QrLink as ReturnType<typeof build>) ?? build();
