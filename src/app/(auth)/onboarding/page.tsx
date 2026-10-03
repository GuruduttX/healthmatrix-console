import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getSession, isProfileComplete } from "@/lib/auth";
import { formatPhone } from "@/lib/doctor-view";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const current = await getSession();
  if (!current) redirect("/login?expired=1");
  const { session, doctor } = current;
  if (session.doctor && (!doctor || !doctor.isActive)) redirect("/login?expired=1");
  if (doctor && isProfileComplete(doctor)) redirect("/");

  return (
    <OnboardingForm
      phone={formatPhone(session.phone)}
      isNew={!doctor}
      initial={{
        name: doctor?.name ?? "",
        registrationNumber: doctor?.registrationNumber ?? "",
        council: doctor?.council ?? "",
        qualifications: doctor?.qualifications ?? "",
        specialties: doctor?.specialties ?? [],
        languages: doctor?.languages ?? [],
        state: doctor?.state ?? "",
        city: doctor?.city ?? "",
        consent: false,
      }}
    />
  );
}
