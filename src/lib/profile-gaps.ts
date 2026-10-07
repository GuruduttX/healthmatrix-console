import type { ProfileGap } from "./types";

/** What each missing part of a profile is called where the console asks for it. */
export const GAP_LABELS: Record<ProfileGap, string> = {
  photo: "Profile photo",
  qualifications: "Qualifications",
  council: "Medical council",
  experience: "Years of experience",
  about: "About you",
};

/** Name, registration, specialties, languages and location: onboarding makes sure of these. */
const BASICS = 5;

/** How complete a profile is, 50 to 100: the basics count from the start. */
export function profilePercent(missing: ProfileGap[]) {
  const total = BASICS + Object.keys(GAP_LABELS).length;
  return Math.round(((total - missing.length) / total) * 100);
}

/** "Profile photo and 2 more", for a one-line nudge. */
export function gapSummary(missing: ProfileGap[]) {
  if (missing.length === 0) return "";
  const first = GAP_LABELS[missing[0]];
  return missing.length === 1 ? first : `${first} and ${missing.length - 1} more`;
}
