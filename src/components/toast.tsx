"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/** A short message after something is done. `problem`: it didn't go as asked. */
type Toast = { id: number; text: string; problem?: boolean };

type Show = (text: string, options?: { problem?: boolean }) => void;

const ToastContext = createContext<Show>(() => {});

/**
 * One message at a time along the bottom, above the phone tab bar, for five seconds. Kept in the
 * layout, so it outlives the row or dialog that raised it. The live region is always there, so
 * screen readers announce each message as it arrives.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback<Show>((text, options) => {
    setToast({ id: Date.now(), text, problem: options?.problem });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center lg:bottom-6 print:hidden"
      >
        {toast ? (
          <p
            key={toast.id}
            className="nudge-enter flex max-w-sm items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-[13px] font-semibold text-white shadow-floating ring-1 ring-white/10"
          >
            {toast.problem ? (
              // A light amber: the warning tint is see-through now, and would vanish on the ink.
              <TriangleAlert aria-hidden className="size-5 shrink-0 text-[#f2c14e]" />
            ) : (
              <CircleCheck aria-hidden className="size-5 shrink-0 text-live" />
            )}
            {toast.text}
          </p>
        ) : null}
      </div>
    </ToastContext>
  );
}

/** Shows a toast: `toast("Booked")`, or `toast("Couldn’t save", { problem: true })`. */
export const useToast = () => useContext(ToastContext);
