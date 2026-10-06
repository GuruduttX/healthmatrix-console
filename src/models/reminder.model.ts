import { Schema, model, models, type InferSchemaType } from "mongoose";

import { REMINDER_KINDS } from "./constants";

/**
 * Medicine, test and vaccine reminders in the member's app. Owned by `healthmatrix-app`; this is
 * a field-for-field copy of its schema, so reminders the console writes read the same there.
 * The console creates vaccine reminders when a prescription is signed and reads `log` to see
 * which doses the patient marked as taken.
 */
const reminderSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    kind: { type: String, enum: REMINDER_KINDS, required: true },
    title: { type: String, required: true }, // "HPV vaccine, dose 2 of 3"
    dose: String,

    /** Daily times as "HH:mm" for medicines; one-off items use `dueAt`. */
    times: [String],
    dueAt: Date,
    startsOn: Date,
    endsOn: Date,

    /** Created from an e-prescription when set. */
    prescription: { type: Schema.Types.ObjectId, ref: "HealthRecord" },
    log: [{ _id: false, dueAt: Date, takenAt: Date }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

reminderSchema.index({ member: 1, isActive: 1 });

export type Reminder = InferSchemaType<typeof reminderSchema>;

const build = () => model("Reminder", reminderSchema);
export const ReminderModel = (models.Reminder as ReturnType<typeof build>) ?? build();
