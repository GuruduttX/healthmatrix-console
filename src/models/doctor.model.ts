import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

/**
 * A doctor on the network. Shares the `doctors` collection with
 * `healthmatrix-app/server`; `council`, `languages`, `state`, `city` and
 * `telemedicineConsentAt` are added for the console.
 */
const doctorSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    qualifications: String, // "MBBS, MD (Medicine)"
    registrationNumber: { type: String, required: true },
    /**
     * `SPECIALTIES` keys, or a specialty the doctor typed ("Orthopaedics"). The app's copy of
     * this schema still restricts it to `SPECIALTIES`; loosen it there before the app saves doctors.
     */
    specialties: { type: [String], default: ["general_medicine"] },
    photoUrl: String,
    isActive: { type: Boolean, default: true },

    /** The council the registration number is with, e.g. "Delhi Medical Council". */
    council: String,
    languages: [String],
    /** One of `INDIAN_STATES`. */
    state: String,
    city: String,
    /** When the doctor agreed to consult under the Telemedicine Practice Guidelines, 2020. */
    telemedicineConsentAt: Date,
  },
  { timestamps: true },
);

export type Doctor = InferSchemaType<typeof doctorSchema>;

// Mongoose keeps models across hot reloads, so a model built from an older version of this
// schema would silently drop new fields (it once dropped `state` and `city`). Rebuild it each
// time this file runs; in production that is once.
if (models.Doctor) deleteModel("Doctor");
export const DoctorModel = model("Doctor", doctorSchema);
