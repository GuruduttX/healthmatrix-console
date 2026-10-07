"use client";

import { CalendarX, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { cancelConsult } from "@/lib/console-actions";

/** Cancels one booked consult, with a reason the patient sees in the app. */
export function CancelConsultButton({ consultId, patientName, when }: { consultId: string; patientName: string; when: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-danger hover:underline"
      >
        Cancel
      </button>
      {open ? <CancelDialog consultId={consultId} patientName={patientName} when={when} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CancelDialog({
  consultId,
  patientName,
  when,
  onClose,
}: {
  consultId: string;
  patientName: string;
  when: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await cancelConsult(consultId, reason);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-card p-0 text-ink shadow-floating backdrop:bg-ink/50"
    >
      <form onSubmit={submit}>
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <CalendarX aria-hidden className="size-5" />
          </span>
          <h2 id={`${id}-title`} className="flex-1 font-display text-lg font-bold">
            Cancel this consult?
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-body hover:bg-selected">
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="px-5 py-4">
          <p className="text-sm text-body">
            {patientName}, {when}. They see “Cancelled by doctor” in the app and can book another slot.
          </p>
          <label className="mt-4 flex flex-col gap-1 text-sm font-semibold text-ink">
            Reason the patient sees (optional)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="e.g. I’m called to an emergency. Please book another time."
              className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal text-ink placeholder:text-body focus:border-brand focus:outline-none"
            />
          </label>
          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected">
            Keep it
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-danger disabled:opacity-60"
          >
            {pending ? "Cancelling…" : "Cancel consult"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
