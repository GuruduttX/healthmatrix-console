"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A form's submit button that says it is working while the form's action runs. */
export function SubmitButton({ children, pendingText, className = "" }: { children: ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
