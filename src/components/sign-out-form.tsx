"use client";

import type { ReactNode } from "react";

import { signOut } from "@/lib/auth-actions";
import { clearAllLocalRx } from "@/lib/rx-autosave";

/** Signs out, first clearing prescriptions in progress that this browser kept. */
export function SignOutForm({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <form action={signOut} onSubmit={clearAllLocalRx} className={className}>
      {children}
    </form>
  );
}
