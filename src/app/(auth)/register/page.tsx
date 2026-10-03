import type { Metadata } from "next";

import { RegisterForm } from "@/components/register-form";
import { networkSpecialties } from "@/lib/data";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return <RegisterForm specialties={networkSpecialties} />;
}
