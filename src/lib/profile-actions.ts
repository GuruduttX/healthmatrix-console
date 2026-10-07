"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DoctorModel } from "@/models";

import { requireDoctor } from "./auth";
import { connectDB } from "./db";
import { canonicalList, languageSuggestions, specialtySuggestions } from "./onboarding";
import { deletePhoto, PhotoError, toWebp, uploadPhoto } from "./profile-photo";
import { profileFields } from "./profile-schema";

/** Edit profile. Registration number and phone are not editable here; council only until it is set. */

export type ProfileField =
  | "name"
  | "qualifications"
  | "experienceYears"
  | "about"
  | "specialties"
  | "languages"
  | "state"
  | "city"
  | "council";

export type ProfileValues = {
  name: string;
  qualifications: string;
  experienceYears: string;
  about: string;
  specialties: string[];
  languages: string[];
  state: string;
  city: string;
  council: string;
};

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Partial<Record<ProfileField, string>>;
  /** What was submitted, so a rejected form comes back filled in. */
  values?: ProfileValues;
  attempt?: number;
};

const profileSchema = z.object({
  name: profileFields.name,
  qualifications: profileFields.qualifications,
  experienceYears: profileFields.experienceYears,
  about: profileFields.about,
  specialties: profileFields.specialties,
  languages: profileFields.languages,
  state: profileFields.state,
  city: profileFields.city,
  council: profileFields.council,
});

export async function updateProfile(prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const doctor = await requireDoctor();

  const values: ProfileValues = {
    name: String(formData.get("name") ?? ""),
    qualifications: String(formData.get("qualifications") ?? ""),
    experienceYears: String(formData.get("experienceYears") ?? ""),
    about: String(formData.get("about") ?? ""),
    specialties: canonicalList(formData.getAll("specialties").map(String), specialtySuggestions),
    languages: canonicalList(formData.getAll("languages").map(String), languageSuggestions),
    state: String(formData.get("state") ?? ""),
    city: String(formData.get("city") ?? ""),
    council: String(formData.get("council") ?? ""),
  };
  const attempt = (prev.attempt ?? 0) + 1;

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ProfileFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as ProfileField] ??= issue.message;
    }
    return { fieldErrors, values, attempt };
  }
  const { qualifications, experienceYears, about, council, ...required } = parsed.data;

  // Optional fields left blank are cleared, so the profile shows what was saved.
  const set: Record<string, unknown> = { ...required };
  const unset: Record<string, 1> = {};
  for (const [field, value] of Object.entries({ qualifications, experienceYears, about })) {
    if (value === undefined) unset[field] = 1;
    else set[field] = value;
  }
  // The council is part of the registration: it can be added once, then only the team changes it.
  if (!doctor.council?.trim() && council) set.council = council;

  await connectDB();
  await DoctorModel.updateOne(
    { _id: doctor._id },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { runValidators: true },
  );
  redirect("/profile?saved=1");
}

export type PhotoResult = { error?: string; photoUrl?: string };

/** Converts the picked image to WebP, stores it and saves its URL. Runs as soon as a photo is picked. */
export async function uploadProfilePhoto(formData: FormData): Promise<PhotoResult> {
  const doctor = await requireDoctor();
  const file = formData.get("photo");
  if (!(file instanceof File)) return { error: "Choose a photo first." };

  let photoUrl: string;
  try {
    photoUrl = await uploadPhoto(String(doctor._id), await toWebp(file));
  } catch (error) {
    if (error instanceof PhotoError) return { error: error.message };
    console.error("[profile] Photo upload failed", error);
    return { error: "We couldn’t save your photo. Check your connection and try again." };
  }

  await connectDB();
  await DoctorModel.updateOne({ _id: doctor._id }, { $set: { photoUrl } });
  refresh();
  return { photoUrl };
}

export async function removeProfilePhoto(): Promise<PhotoResult> {
  const doctor = await requireDoctor();
  try {
    await deletePhoto(String(doctor._id));
  } catch (error) {
    // The URL is cleared anyway: the doctor asked for the photo to stop showing.
    console.error("[profile] Photo delete failed", error);
  }
  await connectDB();
  await DoctorModel.updateOne({ _id: doctor._id }, { $unset: { photoUrl: 1 } });
  refresh();
  return {};
}
