"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

import type { Doctor } from "@/lib/types";

/** What the phone headers and tab bar show on every screen, read once by the layout. */
export type Chrome = {
  doctor: Pick<Doctor, "name" | "initials" | "photoUrl" | "specialty" | "missing">;
  /** Notifications not yet read. */
  unread: number;
  /** Booking requests waiting for an answer. */
  requests: number;
};

const ChromeContext = createContext<Chrome>({
  doctor: { name: "", initials: "", specialty: "", missing: [] },
  unread: 0,
  requests: 0,
});

/** Whether this tab has moved between console screens, so Back can return to the last one. */
let movedWithinConsole = false;

export const canGoBackInConsole = () => movedWithinConsole;

/** Gives the headers and tab bar the doctor and the counts, and remembers in-console moves. */
export function ChromeProvider({ value, children }: { value: Chrome; children: ReactNode }) {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) movedWithinConsole = true;
  }, [pathname]);

  return <ChromeContext value={value}>{children}</ChromeContext>;
}

export const useChrome = () => useContext(ChromeContext);
