import { Schema, model, models, type InferSchemaType } from "mongoose";

/** An entry an answer cites, as it was when the answer was written (`AskSource`). */
const askSourceSchema = new Schema(
  {
    ref: { type: String, required: true },
    id: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
  },
  { _id: false, id: false },
);

/**
 * A doctor's "Ask the record" conversation about one patient, so it survives a reload or a visit
 * to another page. Console only, one per doctor and patient. MongoDB deletes it 6 hours after the
 * last question (`expiresAt`).
 */
const askConversationSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    /** Questions with their whole answers, oldest first. Failed and stopped answers aren't kept. */
    exchanges: [
      {
        _id: false,
        question: { type: String, required: true },
        answer: { type: String, required: true },
        sources: [askSourceSchema],
        askedAt: { type: Date, required: true },
      },
    ],
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

askConversationSchema.index({ doctor: 1, member: 1 }, { unique: true });

export type AskConversation = InferSchemaType<typeof askConversationSchema>;

const build = () => model("AskConversation", askConversationSchema);
export const AskConversationModel = (models.AskConversation as ReturnType<typeof build>) ?? build();
