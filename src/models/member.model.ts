import { Schema, model, models, type InferSchemaType } from "mongoose";

import { BLOOD_GROUPS, GENDERS, PLAN_IDS } from "./constants";

/** A HealthMatrix member: the doctor's patient. Owned by `healthmatrix-app/server`. */
const memberSchema = new Schema(
  {
    /** Twelve digits, shown as "HM 4829 1057 3316". */
    memberId: { type: String, required: true, unique: true, match: /^\d{12}$/ },
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: GENDERS },

    /**
     * Profile photo, a small JPEG kept on the member. `photoKey` is set whenever a
     * photo exists; the bytes are only read when asked for.
     */
    photoKey: { type: String, unique: true, sparse: true },
    photoData: { type: Buffer, select: false },
    photoMimeType: { type: String, select: false },
    bloodGroup: { type: String, enum: BLOOD_GROUPS },

    abha: {
      number: String,
      address: String,
      linkedAt: Date,
    },

    plan: { type: String, enum: PLAN_IDS, default: "essential" },
    memberSince: { type: Date, default: Date.now },
    validThru: Date,

    family: { type: Schema.Types.ObjectId, ref: "Family" },
  },
  { timestamps: true },
);

export type Member = InferSchemaType<typeof memberSchema>;

const build = () => model("Member", memberSchema, "members");
export const MemberModel = (models.Member as ReturnType<typeof build>) ?? build();
