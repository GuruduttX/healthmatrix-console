import { z } from "zod";

import {
  ABOUT_MAX,
  canonicalState,
  languageSuggestions,
  specialtySuggestions,
  type Suggestion,
} from "./onboarding";

/** Profile fields as onboarding and Edit profile check them, so both accept the same things. */

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => value || undefined);

/**
 * A typed specialty or language: starts with a letter, no digits or odd symbols.
 * Suggestions pass as they are (the app's specialties are keys like `general_medicine`);
 * only what the doctor typed is checked.
 */
const entry = (suggestions: Suggestion[], max: number, message: string) => {
  const known = new Set(suggestions.map((s) => s.value));
  const typed = /^\p{L}[\p{L}\p{M} &()\/.'-]*$/u;
  return z
    .string()
    .refine((value) => known.has(value) || (value.length >= 2 && typed.test(value)), message)
    .refine((value) => known.has(value) || value.length <= max, `Keep each under ${max} characters`);
};

export const profileFields = {
  name: z.string().trim().min(2, "Enter your full name").max(80, "Keep this under 80 characters"),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Enter your medical registration number")
    .max(40, "Keep this under 40 characters"),
  council: optionalText(80),
  qualifications: optionalText(120),
  specialties: z
    .array(entry(specialtySuggestions, 50, "Specialties can use letters, spaces and & ( ) / - only"))
    .min(1, "Add at least one specialty")
    .max(10, "Add up to 10 specialties"),
  languages: z
    .array(entry(languageSuggestions, 30, "Languages can use letters and spaces only"))
    .min(1, "Add at least one language you consult in")
    .max(12, "Add up to 12 languages"),
  state: z
    .string()
    .transform((state): string => canonicalState(state) ?? "")
    .pipe(z.string().min(1, "Choose your state or union territory from the list")),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(60, "Keep this under 60 characters")
    .regex(/^\p{L}[\p{L}\p{M} .'-]*$/u, "City can use letters, spaces and . ' - only"),
  /** Blank, or whole years from 0 to 70. */
  experienceYears: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,2}$/.test(value), "Enter whole years, like 12")
    .transform((value) => (value === "" ? undefined : Number(value)))
    .refine((value) => value === undefined || value <= 70, "Enter 70 years or fewer"),
  about: optionalText(ABOUT_MAX),
};
