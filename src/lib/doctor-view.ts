import { cache } from "react";

import { requireDoctor } from "./auth";
import type { Doctor, ProfileGap } from "./types";
import { specialtyLabel } from "./onboarding";

type DoctorRecord = Awaited<ReturnType<typeof requireDoctor>>;

/** "Dr Anjali Mehta" → ["Anjali", "Mehta"]: the name without the title. */
function nameParts(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter((part, i) => !(i === 0 && /^dr\.?$/i.test(part)));
}

/** "9810012345" → "+91 98100 12345". */
export const formatPhone = (phone: string) => `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

/**
 * The optional parts of a profile. Onboarding makes sure of the rest; these make the profile
 * patients see complete, and the console nudges doctors to add them.
 */
function profileGaps(doctor: DoctorRecord): ProfileGap[] {
  const gaps: [ProfileGap, unknown][] = [
    ["photo", doctor.photoUrl],
    ["qualifications", doctor.qualifications?.trim()],
    ["council", doctor.council?.trim()],
    ["experience", doctor.experienceYears != null],
    ["about", doctor.about?.trim()],
  ];
  return gaps.filter(([, done]) => !done).map(([gap]) => gap);
}

/** The doctor as the console screens show it. */
export function toUiDoctor(doctor: DoctorRecord): Doctor {
  const parts = nameParts(doctor.name);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const specialties = (doctor.specialties ?? []).map(specialtyLabel);

  return {
    id: String(doctor._id),
    name: /^dr\.?\s/i.test(doctor.name.trim()) ? doctor.name.trim() : `Dr ${parts.join(" ")}`,
    shortName: last ? `Dr ${first[0]}. ${last}` : `Dr ${first}`,
    initials: ((first[0] ?? "") + (last[0] ?? "")).toUpperCase(),
    qualifications: doctor.qualifications ?? "",
    specialty: specialties[0] ?? "",
    phone: formatPhone(doctor.phone),
    registrationNumber: doctor.registrationNumber,
    council: doctor.council ?? "",
    specialties,
    languages: doctor.languages ?? [],
    location: [doctor.city, doctor.state].filter(Boolean).join(", "),
    photoUrl: doctor.photoUrl ?? undefined,
    about: doctor.about ?? "",
    experienceYears: doctor.experienceYears ?? undefined,
    missing: profileGaps(doctor),
  };
}

/** The signed-in doctor for console screens; redirects when there isn't one. */
export const getCurrentDoctor = cache(async () => toUiDoctor(await requireDoctor()));
