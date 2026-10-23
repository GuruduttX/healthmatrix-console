import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: { absolute: "The doctor console | HealthMatrix" },
  description:
    "One calm console for your schedule, patient records, video consults, prescriptions and lab results. Records open only with the patient’s OTP. Join in four steps.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
