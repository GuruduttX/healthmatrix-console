import type { Patient, PlanId } from "./types";

/** Patient wording shared by server pages and client components. */

export const planNames: Record<PlanId, string> = {
  essential: "Essential",
  plus: "Plus",
  family: "Family",
  senior_care: "Senior Care",
  community: "Community",
};

/** "38 years, female", leaving out whatever the member hasn't given. */
export function ageAndSex(patient: Pick<Patient, "age" | "sex">) {
  return [patient.age !== undefined ? `${patient.age} years` : "", patient.sex ?? ""].filter(Boolean).join(", ");
}

/** "38 years, female. O+. Plus plan." */
export function demographics(patient: Patient, { bloodGroupLabel = "" } = {}) {
  return [
    ageAndSex(patient),
    patient.bloodGroup ? `${bloodGroupLabel}${patient.bloodGroup}` : "",
    `${planNames[patient.plan]} plan`,
  ]
    .filter(Boolean)
    .map((part) => `${part}.`)
    .join(" ");
}

/** Words in a prescription line that clash with a recorded allergy. */
const allergyTermMap: Record<string, string[]> = {
  sulfa: ["sulfa", "co-trimoxazole", "cotrimoxazole", "sulfamethoxazole", "sulphamethoxazole"],
  "sulfa drugs": ["sulfa", "co-trimoxazole", "cotrimoxazole", "sulfamethoxazole", "sulphamethoxazole"],
  penicillin: ["penicillin", "amoxicillin", "ampicillin", "cloxacillin"],
  aspirin: ["aspirin", "acetylsalicylic"],
  nsaids: ["ibuprofen", "diclofenac", "naproxen", "aspirin"],
};

export function allergyTerms(allergies: string[]) {
  return [
    ...new Set(
      allergies.flatMap((allergy) => {
        const key = allergy.trim().toLowerCase();
        return key ? (allergyTermMap[key] ?? [key]) : [];
      }),
    ),
  ];
}

/** The first prescription line that clashes with an allergy, if any. */
export function allergyClash(items: string[], terms: string[]) {
  return items.find((item) => terms.some((term) => item.toLowerCase().includes(term)));
}
