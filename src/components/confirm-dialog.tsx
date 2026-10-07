"use client";

import { TriangleAlert, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

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
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl bg-card p-0 text-ink shadow-floating backdrop:bg-ink/50 sm:inset-0 sm:m-auto sm:h-fit sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-3xl"
    >
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <TriangleAlert aria-hidden className="size-5" />
        </span>
        <h2 id={`${id}-title`} className="flex-1 font-display text-lg font-bold">
          {title}
        </h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full p-2 text-body hover:bg-selected">
          <X aria-hidden className="size-5" />
        </button>
      </header>
      <div id={`${id}-body`} className="px-5 py-4 text-sm leading-relaxed text-body">
        {children}
      </div>
      <footer className="flex gap-2 border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:justify-end sm:pb-4">
        {/* Focused first, so Enter keeps things as they are. */}
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm font-bold text-ink hover:bg-selected sm:flex-none"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-brand sm:flex-none"
        >
          {confirmLabel}
        </button>
      </footer>
    </dialog>
  );
}
