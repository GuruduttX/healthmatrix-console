import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A one-time code sent to a doctor's phone to sign in. Kept apart from the app's
 * `otpchallenges`, which are looked up by phone alone: a doctor who is also a member
 * would otherwise have each sign-in wipe out the other's code.
 */
const doctorOtpChallengeSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export type DoctorOtpChallenge = InferSchemaType<typeof doctorOtpChallengeSchema>;

const build = () => model("DoctorOtpChallenge", doctorOtpChallengeSchema);
export const DoctorOtpChallengeModel =
  (models.DoctorOtpChallenge as ReturnType<typeof build>) ?? build();
