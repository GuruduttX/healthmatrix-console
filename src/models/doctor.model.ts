import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

/**
 * A doctor on the network. Shares the `doctors` collection with
 * `healthmatrix-app/server`; `council`, `languages`, `state`, `city`,
 * `telemedicineConsentAt`, `about`, `experienceYears`, `schedule` and `settings` are added
 * for the console.
 */
/** One working session on a weekday, India time: { weekday: 1, from: "09:00", to: "13:00" }. */
const sessionSchema = new Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  { _id: false },
);

/** A stretch the doctor can't be booked: whole days or part of one. */
const timeOffSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  note: String,
});

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
    /** A WebP on Cloudinary, uploaded from Edit profile. See `src/lib/profile-photo.ts`. */
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
    /** A few lines patients read about the doctor, from Edit profile. */
    about: String,
    /** Years in practice since registration. */
    experienceYears: { type: Number, min: 0, max: 70 },

    /**
     * When members can book, read by the app. Mirrored in the app's doctor schema; read with
     * `resolveSchedule` in `src/lib/schedule.ts`, which fills in defaults.
     */
    schedule: {
      acceptingBookings: Boolean,
      slotMinutes: Number,
      bookingWindowDays: Number,
      minNoticeMinutes: Number,
      weekly: { type: [sessionSchema], default: undefined },
      timeOff: { type: [timeOffSchema], default: undefined },
      updatedAt: Date,
    },

    /** Console settings. Missing on doctors saved before they existed; read with defaults. */
    settings: {
      /** Not used by the app yet: there is no instant GP consult or pod call to switch. */
      availability: { gpNow: Boolean, podCalls: Boolean },
      alerts: { otp: Boolean, results: Boolean, starting: Boolean, bookings: Boolean, ekaay: Boolean },
      /** Notifications from before this are shown as read. */
      notificationsSeenAt: Date,
    },
  },
  { timestamps: true },
);

export type Doctor = InferSchemaType<typeof doctorSchema>;

// Mongoose keeps models across hot reloads, so a model built from an older version of this
// schema would silently drop new fields (it once dropped `state` and `city`). Rebuild it each
// time this file runs; in production that is once.
if (models.Doctor) deleteModel("Doctor");
export const DoctorModel = model("Doctor", doctorSchema);
