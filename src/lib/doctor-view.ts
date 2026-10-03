import { cache } from "react";

import { requireDoctor } from "./auth";
import type { Doctor } from "./types";
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

/** The doctor as the console screens show it. */
export function toUiDoctor(doctor: DoctorRecord): Doctor {
  const parts = nameParts(doctor.name);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const specialties = (doctor.specialties ?? []).map(specialtyLabel);

  return {
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
  };
}

/** The signed-in doctor for console screens; redirects when there isn't one. */
export const getCurrentDoctor = cache(async () => toUiDoctor(await requireDoctor()));
