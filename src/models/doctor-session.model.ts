import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A signed-in browser. Only the hash of the cookie token is stored. A session without
 * a `doctor` belongs to a verified phone that hasn't finished onboarding yet.
 */
const doctorSessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export type DoctorSession = InferSchemaType<typeof doctorSessionSchema>;

const build = () => model("DoctorSession", doctorSessionSchema);
export const DoctorSessionModel = (models.DoctorSession as ReturnType<typeof build>) ?? build();
