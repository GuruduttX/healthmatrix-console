import { Schema, model, models, type InferSchemaType } from "mongoose";

import { ALERT_CHANNELS } from "./constants";

/** Every QR scan is logged with time and place, and the family is alerted. */
const scanLogSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    qrLink: { type: Schema.Types.ObjectId, ref: "QrLink", required: true },
    scannedAt: { type: Date, default: Date.now },

    /** GeoJSON point, [longitude, latitude]. Absent if the scanner denied location. */
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
    ip: String,
    userAgent: String,

    alertedContacts: [{ phone: String, channel: { type: String, enum: ALERT_CHANNELS } }],
  },
  { timestamps: true },
);

scanLogSchema.index({ member: 1, scannedAt: -1 });

export type ScanLog = InferSchemaType<typeof scanLogSchema>;

const build = () => model("ScanLog", scanLogSchema, "scanlogs");
export const ScanLogModel = (models.ScanLog as ReturnType<typeof build>) ?? build();
