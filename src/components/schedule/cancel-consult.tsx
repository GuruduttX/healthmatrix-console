"use client";

import { CalendarX } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { DialogBody, DialogError, DialogFooter, DialogHeader, dialogClass } from "@/components/dialog-parts";
import { useToast } from "@/components/toast";
import { cancelConsult } from "@/lib/console-actions";

/** Cancels one booked consult, with a reason the patient sees in the app. */
export function CancelConsultButton({ consultId, patientName, when }: { consultId: string; patientName: string; when: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded text-xs font-semibold text-muted transition-colors hover:text-danger"
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
  const toast = useToast();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await cancelConsult(consultId, reason);
      if (result.error) return setError(result.error);
      onClose();
      toast(`Cancelled. ${patientName} has been told in the app.`);
    });
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={`${id}-title`} className={dialogClass}>
      <form onSubmit={submit}>
        <DialogHeader titleId={`${id}-title`} title="Cancel this consult?" icon={CalendarX} tone="danger" onClose={onClose} />
        <DialogBody>
          <p>
            <span className="font-semibold text-ink">{patientName}</span>, {when}. They see “Cancelled by doctor” in the
            app and can book another slot.
          </p>
          <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            Reason the patient sees (optional)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="e.g. I’m called to an emergency. Please book another time."
              className="field"
            />
          </label>
          {error ? <DialogError>{error}</DialogError> : null}
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Keep it
          </button>
          <button type="submit" disabled={pending} className="btn btn-danger">
            {pending ? "Cancelling…" : "Cancel consult"}
          </button>
        </DialogFooter>
      </form>
    </dialog>
  );
}
