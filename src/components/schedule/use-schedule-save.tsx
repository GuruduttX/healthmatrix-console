"use client";

import { CalendarX, CircleCheck, TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import type { Clash, ClashChoice, ScheduleResult } from "@/lib/console-actions";

type Action = (choice?: ClashChoice) => Promise<ScheduleResult>;

/**
 * Runs a schedule change. When it would leave booked consults outside the new hours, nothing
 * is saved yet: the doctor is asked whether to keep those bookings or cancel them, and the
 * change is sent again with the answer.
 */
export function useScheduleSave() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ScheduleResult>();
  const [ask, setAsk] = useState<{ clashes: Clash[]; action: Action; onSaved?: () => void } | null>(null);

  function send(action: Action, choice: ClashChoice | undefined, onSaved?: () => void) {
    startTransition(async () => {
      const next = await action(choice);
      if (next.clashes) {
        setResult(undefined);
        setAsk({ clashes: next.clashes, action, onSaved });
        return;
      }
      setResult(next);
      if (next.saved) onSaved?.();
    });
  }

  const run = (action: Action, onSaved?: () => void) => send(action, undefined, onSaved);

  function choose(choice: ClashChoice) {
    if (!ask) return;
    setAsk(null);
    send(ask.action, choice, ask.onSaved);
  }

  const dialog = ask ? <ClashDialog clashes={ask.clashes} onChoose={choose} onClose={() => setAsk(null)} /> : null;
  return { run, pending, result, clear: () => setResult(undefined), dialog };
}

/** The outcome of the last save: what went wrong, or that it worked. */
export function SaveMessage({ result, savedText }: { result?: ScheduleResult; savedText: string }) {
  if (result?.errors?.length) {
    return (
      <div role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
        <p className="flex items-center gap-2 font-bold">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {result.errors.length === 1 ? result.errors[0] : "Please fix these first"}
        </p>
        {result.errors.length > 1 ? (
          <ul className="mt-1.5 list-disc pl-6 text-ink">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (result?.saved) {
    return (
      <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          {savedText}
          {result.cancelled
            ? ` ${result.cancelled} ${result.cancelled === 1 ? "booking was" : "bookings were"} cancelled. Those patients see it in the app and can book again.`
            : ""}
        </span>
      </p>
    );
  }
  return null;
}

function ClashDialog({
  clashes,
  onChoose,
  onClose,
}: {
  clashes: Clash[];
  onChoose: (choice: ClashChoice) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const many = clashes.length > 1;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-card p-0 text-ink shadow-floating backdrop:bg-ink/50"
    >
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <CalendarX aria-hidden className="size-5" />
        </span>
        <h2 id={`${id}-title`} className="flex-1 font-display text-lg font-bold">
          {clashes.length} {many ? "bookings fall" : "booking falls"} outside your new hours
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-body hover:bg-selected">
          <X aria-hidden className="size-5" />
        </button>
      </header>
      <div className="px-5 py-4">
        <ul className="max-h-60 divide-y divide-line overflow-y-auto rounded-xl border border-line">
          {clashes.map((clash) => (
            <li key={clash.id} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
              <span className="font-semibold text-ink">{clash.name}</span>
              <span className="text-body">{clash.when}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-body">
          Keep {many ? "them" : "it"} if you’ll still take {many ? "these consults" : "this consult"}. If you cancel,{" "}
          {many ? "each patient sees" : "the patient sees"} “Cancelled by doctor” in the app and can book another slot.
        </p>
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
        <button
          type="button"
          onClick={() => onChoose("keep")}
          className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected"
        >
          Keep {many ? "bookings" : "booking"}
        </button>
        <button
          type="button"
          onClick={() => onChoose("cancel")}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-danger"
        >
          Cancel {many ? "them" : "it"} and tell {many ? "patients" : "the patient"}
        </button>
      </footer>
    </dialog>
  );
}
