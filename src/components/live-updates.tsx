"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";

/** How often a screen reads itself again while the doctor is looking at it. */
export const LIVE_EVERY_MS = 30_000;

type Live = {
  /** Reads the current screen from the database again. */
  check: () => void;
  checking: boolean;
  /** When the screen was last read again, by the doctor or on its own. */
  checkedAt: Date | null;
};

const LiveContext = createContext<Live>({ check: () => {}, checking: false, checkedAt: null });

/** The doctor is typing: a re-read now could move the row or field under the cursor. */
const isTyping = () =>
  document.activeElement instanceof HTMLElement &&
  document.activeElement.matches("input, textarea, select, [contenteditable]:not([contenteditable='false'])");

/**
 * Keeps every console screen current without a reload: every 30 seconds while the tab is in view,
 * and at once when the doctor comes back to it. Only the data is fetched again, so scroll
 * position and half-typed text stay as they are. A tick is skipped while a dialog is open or the
 * doctor is typing, and taken on the next one after.
 */
export function LiveUpdates({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, startTransition] = useTransition();
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  /** When the screen's data was last fetched, in ms. Opening a screen fetches it. */
  const fetchedAt = useRef(0);

  useEffect(() => {
    fetchedAt.current = Date.now();
  }, [pathname]);

  const check = useCallback(() => {
    fetchedAt.current = Date.now();
    startTransition(() => {
      router.refresh();
      setCheckedAt(new Date());
    });
  }, [router]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      // Not under an open dialog: the row it belongs to could leave the list while it is open.
      if (document.querySelector("dialog[open]") || isTyping()) return;
      if (Date.now() - fetchedAt.current >= LIVE_EVERY_MS) check();
    };
    const timer = setInterval(tick, 5_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [check]);

  return <LiveContext value={{ check, checking, checkedAt }}>{children}</LiveContext>;
}

export const useLiveUpdates = () => useContext(LiveContext);
