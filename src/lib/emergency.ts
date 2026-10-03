/**
 * The public emergency view (layer 1) opened by scanning a member's QR.
 * Shared types and formatting; the database side is in `emergency-db.ts`.
 */

import type { BloodGroup } from "./types";

export type EmergencyContact = {
  name: string;
  relation?: string;
  /** As stored by the app: 10 digits, e.g. 9876543210. */
  phone: string;
};

/**
 * Only what the member chose to show and actually filled in. A field that is
 * hidden or empty is left out entirely, so an absent field never reads as "none".
 */
export type EmergencyProfileView = {
  member: {
    name: string;
    firstName: string;
    initials: string;
    /** Left out when the member has not added a date of birth. */
    age?: number;
    gender?: "female" | "male" | "other";
    /** Whether `/e/<code>/photo` will serve a photo. */
    hasPhoto: boolean;
  };
  bloodGroup?: BloodGroup;
  allergies?: string[];
  conditions?: string[];
  medicines?: string[];
  emergencyContacts?: EmergencyContact[];
  organDonor?: boolean;
  insurance?: { provider: string; policyNumber?: string };
};

export const helplines = {
  ambulance: { number: "108", label: "Ambulance" },
  emergency: { number: "112", label: "Emergency" },
} as const;

/** "9876543210" → "tel:+919876543210". Numbers already carrying a country code keep it. */
export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `tel:+${digits}`;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}
