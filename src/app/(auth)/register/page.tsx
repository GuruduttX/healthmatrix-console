import { redirect } from "next/navigation";

/** Sign-up starts at sign-in now: a new number goes on to onboarding after the OTP. */
export default function RegisterPage() {
  redirect("/login");
}
