import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

import {
  INTERVAL_UNITS,
  VACCINATION_STATUSES,
  VACCINE_DOSE_UNITS,
  VACCINE_ROUTES,
  VACCINE_SCHEDULES,
  VACCINE_SITES,
} from "./constants";

const doseSchema = new Schema(
  {
    /** The dose's place in the series: 2 for "dose 2 of 3". */
    number: { type: Number, required: true, min: 1 },
    /** Midnight India time on the day it is due. */
    dueOn: { type: Date, required: true },
    /** The app reminder for this dose, made on signing. The patient marks it taken there. */
    reminder: { type: Schema.Types.ObjectId, ref: "Reminder" },
  },
  { _id: false },
);

/**
 * A vaccine prescribed on a prescription, with every dose date. Owned by the console. Drafts
 * change freely; signing the prescription schedules it and adds one app reminder per dose.
 * Whether a dose was given is read from its reminder's `log`, never stored here.
 */
const vaccinationSchema = new Schema(
  {
    member: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    prescription: { type: Schema.Types.ObjectId, ref: "Prescription", required: true },
    consult: { type: Schema.Types.ObjectId, ref: "Consult" },

    name: { type: String, required: true, trim: true }, // "HPV"
    brand: { type: String, trim: true }, // "Gardasil 9"
    dose: {
      amount: { type: Number, required: true, min: 0 },
      unit: { type: String, enum: VACCINE_DOSE_UNITS, required: true },
    },
    route: { type: String, enum: VACCINE_ROUTES, required: true },
    site: { type: String, enum: VACCINE_SITES },
    instructions: { type: String, trim: true, maxlength: 300 },

    schedule: {
      type: { type: String, enum: VACCINE_SCHEDULES, required: true },
      /** For recurring vaccines: "every 1 month". */
      every: {
        count: { type: Number, min: 1 },
        unit: { type: String, enum: INTERVAL_UNITS },
      },
      /** Doses in the whole series, counting any given before this prescription. */
      totalDoses: { type: Number, required: true, min: 1 },
    },
    doses: {
      type: [doseSchema],
      validate: { validator: (doses: unknown[]) => doses.length > 0, message: "A vaccine needs at least one dose." },
    },

    status: { type: String, enum: VACCINATION_STATUSES, default: "draft" },
  },
  { timestamps: true },
);

vaccinationSchema.index({ prescription: 1 });
vaccinationSchema.index({ member: 1, "doses.dueOn": 1 });

export type Vaccination = InferSchemaType<typeof vaccinationSchema>;

// Rebuilt on every load so a hot reload never keeps an older schema; see doctor.model.ts.
if (models.Vaccination) deleteModel("Vaccination");
export const VaccinationModel = model("Vaccination", vaccinationSchema);
