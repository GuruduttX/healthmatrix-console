import type { Metadata } from "next";
import { DoctorLanding } from "@/components/landing/doctor-landing";

export const metadata: Metadata = {
  title: "Care with the whole picture | HealthMatrix",
  description: "A connected workspace for doctors. Bring patient records, consultations, Ekaay summaries and prescriptions together with HealthMatrix.",
};

export default function WelcomePage() {
  return <DoctorLanding />;
}
