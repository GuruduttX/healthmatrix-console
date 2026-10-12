import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A one-time code sent to a doctor's phone to sign in. Kept apart from the app's
 * `otpchallenges`, which are looked up by phone alone: a doctor who is also a member
 * would otherwise have each sign-in wipe out the other's code.
 */
const doctorOtpChallengeSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    /** The code's hash when it was made here (test mode); Twilio keeps its own codes. */
    codeHash: String,
    /** Twilio Verify's id for the code (VE…), when Twilio sent it. */
    verificationSid: String,
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export type DoctorOtpChallenge = InferSchemaType<typeof doctorOtpChallengeSchema>;

const build = () => model("DoctorOtpChallenge", doctorOtpChallengeSchema);
export const DoctorOtpChallengeModel =
  (models.DoctorOtpChallenge as ReturnType<typeof build>) ?? build();
