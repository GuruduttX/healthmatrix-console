import {
  INDIAN_STATES,
  LANGUAGES,
  MORE_SPECIALTIES,
  SPECIALTIES,
  SPECIALTY_LABELS,
  type Specialty,
} from "@/models/constants";

/**
 * Onboarding choices, shared by the form (suggestions) and the server action (clean-up).
 * Free of server code so the client form can import it.
 */

export type Suggestion = { value: string; label: string };

/** How long "About you" on Edit profile may be. */
export const ABOUT_MAX = 600;

/** The app's specialties are stored as their keys; the rest as written. */
export const specialtySuggestions: Suggestion[] = [
  ...SPECIALTIES.map((key) => ({ value: key, label: SPECIALTY_LABELS[key] })),
  ...MORE_SPECIALTIES.map((label) => ({ value: label, label })),
];

export const languageSuggestions: Suggestion[] = LANGUAGES.map((label) => ({ value: label, label }));

export const specialtyLabel = (value: string) =>
  SPECIALTY_LABELS[value as Specialty] ?? value;

/** Collapses spaces and capitalises the first letter: "  orthopaedics " → "Orthopaedics". */
export const tidyText = (text: string) => {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Maps what was typed or picked to a suggestion's value when it matches one, ignoring case
 * ("cardiology" → "cardiology" key, "hindi" → "Hindi"); otherwise keeps the tidied text.
 * Drops blanks and repeats.
 */
export function canonicalList(values: string[], suggestions: Suggestion[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const text = tidyText(raw);
    if (!text) continue;
    const lower = text.toLowerCase();
    const match = suggestions.find(
      (s) => s.value.toLowerCase() === lower || s.label.toLowerCase() === lower,
    );
    const value = match?.value ?? text;
    if (seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    result.push(value);
  }
  return result;
}

/** "tamil nadu" → "Tamil Nadu"; anything not a state or union territory → undefined. */
export const canonicalState = (text: string) =>
  INDIAN_STATES.find((state) => state.toLowerCase() === tidyText(text).toLowerCase());
