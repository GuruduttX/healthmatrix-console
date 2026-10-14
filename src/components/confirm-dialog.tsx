"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { DialogBody, DialogFooter, DialogHeader, dialogClass } from "@/components/dialog-parts";

/**
 * Asks before something that can't be undone, in place of the browser's `confirm()`. Render it
 * only while asking: it opens as it mounts. Escape, the ✕ and the backdrop all mean no.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onClick={(event) => event.target === ref.current && onCancel()}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      className={dialogClass}
    >
      <DialogHeader titleId={`${id}-title`} title={title} icon={TriangleAlert} tone="danger" onClose={onCancel} />
      <DialogBody id={`${id}-body`}>{children}</DialogBody>
      <DialogFooter>
        {/* Focused first, so Enter keeps things as they are. */}
        <button type="button" autoFocus onClick={onCancel} className="btn btn-secondary">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className="btn btn-danger">
          {confirmLabel}
        </button>
      </DialogFooter>
    </dialog>
  );
}
