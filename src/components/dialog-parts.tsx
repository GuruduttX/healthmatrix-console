import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The look shared by the console's small dialogs: a sheet from the bottom on phones, as in the
 * app, and a centred card elsewhere. Put it on the `<dialog>`; the parts below fill it.
 */
export const dialogClass =
  "sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border-0 bg-card p-0 text-ink shadow-floating backdrop:bg-ink-deep/50 backdrop:backdrop-blur-[3px] sm:inset-0 sm:m-auto sm:h-fit sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-3xl";

const iconTones = {
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand",
  neutral: "bg-selected text-ink-mid",
};

export function DialogHeader({
  titleId,
  title,
  icon: Icon,
  tone = "neutral",
  onClose,
}: {
  titleId: string;
  title: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof iconTones;
  onClose: () => void;
}) {
  return (
    <header className="px-5 pb-1 pt-2.5 sm:pt-5">
      {/* The grab handle of a phone sheet. */}
      <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line-strong sm:hidden" />
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}>
            <Icon aria-hidden className="size-5" />
          </span>
        ) : null}
        <h2 id={titleId} className="flex-1 font-display text-lg font-bold leading-snug tracking-[-0.01em]">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-sm btn-icon -mr-1.5 bg-surface">
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </header>
  );
}

export function DialogBody({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} className="px-5 py-3 text-sm leading-relaxed text-body">
      {children}
    </div>
  );
}

/** Buttons along the bottom: full width side by side on phones, to the right elsewhere. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="mt-2 flex gap-2 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:justify-end sm:pb-5 [&>*]:flex-1 sm:[&>*]:flex-none">
      {children}
    </footer>
  );
}

export function DialogError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
      {children}
    </p>
  );
}
