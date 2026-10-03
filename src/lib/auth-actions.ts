"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "./session";

/** Any six digits sign in while the console runs on sample data. */
export async function signIn(formData: FormData) {
  const otp = String(formData.get("otp") ?? "");
  const phone = String(formData.get("phone") ?? "");

  if (!/^\d{6}$/.test(otp)) {
    redirect(`/login/verify?phone=${encodeURIComponent(phone)}&error=otp`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "demo", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login?signedout=1");
}
