"use client";

import { CalendarCheck, CalendarClock, CalendarX, Check, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { DialogBody, DialogError, DialogFooter, DialogHeader, dialogClass } from "@/components/dialog-parts";
import { useToast } from "@/components/toast";
import { Avatar, Card, Chip, EmptyState, Section } from "@/components/ui";
import { approveConsultRequest, declineConsultRequest } from "@/lib/console-actions";
import type { ConsultRequest } from "@/lib/types";

/** Notes a doctor often sends when declining. The patient reads them word for word. */
const QUICK_NOTES = ["I’m not available at this time.", "Please book one of my open slots."];

/**
 * Patients asking for a time that isn't one of the open slots, with Approve and Decline.
 * Nothing is booked until the doctor approves. Below them, the requests whose time passed with
 * no reply in the last day, marked not attended. Without requests it shows `emptyText`, or
 * nothing at all when there is none.
 */
export function RequestsCard({
  id,
  requests,
  emptyText,
  className = "",
}: {
  id?: string;
  requests: ConsultRequest[];
  emptyText?: string;
  className?: string;
}) {
  if (requests.length === 0 && emptyText === undefined) return null;
  const waiting = requests.filter((r) => !r.missed);
  const missed = requests.filter((r) => r.missed);

  return (
    <Section
      id={id}
      title="Booking requests"
      count={waiting.length}
      className={className}
    >
      <p className="-mt-1.5 mb-3 px-0.5 text-[13px] text-body">Times outside your open slots. Nothing is booked until you approve.</p>
      {/* Lays its rows out by its own width: a row on Schedule, stacked in Today's side column. */}
      <Card flush className="@container">
        {waiting.length ? (
          <ul className="divide-y divide-line">
            {waiting.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarCheck} tone="success" title="No requests waiting">
            {emptyText}
          </EmptyState>
        )}
        {missed.length ? (
          <>
            <h3
              className="border-y border-line bg-white/45 px-4 py-2 text-xs font-bold text-body @md:px-5"
            >
              Time passed without a reply
            </h3>
            <ul className="divide-y divide-line">
              {missed.map((request) => (
                <MissedRow key={request.id} request={request} />
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </Section>
  );
}

/** A request nobody answered before its time: there is nothing left to decide, only to know. */
function MissedRow({ request }: { request: ConsultRequest }) {
  const { patient } = request;
  return (
    <li className="flex gap-3 px-4 py-3.5 @md:px-5">
      <Avatar initials={patient.initials} tone={patient.avatarTone} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 text-body">
          <Link href={`/patients/${patient.id}`} className="font-bold text-ink hover:underline">
            {patient.name}
          </Link>
          {request.about ? <span className="text-[13px] text-muted"> · {request.about}</span> : null}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-body">
          <CalendarClock aria-hidden className="size-3.5 text-muted" />
          <span className="font-bold tabular-nums text-ink">{request.when}</span>
        </p>
        {request.reason ? <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-body">{request.reason}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Chip tone="danger" icon={CalendarX}>
            Not attended
          </Chip>
          <span className="text-xs text-muted">
            Asked {request.askedAgo}. {patient.firstName} was told you didn’t reply in time.
          </span>
        </div>
      </div>
    </li>
  );
}

function RequestRow({ request }: { request: ConsultRequest }) {
  const { patient } = request;
  // The toast lives in the layout, so it outlives this row once the answer takes it off the list.
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [declining, setDeclining] = useState(false);

  function approve() {
    setError(undefined);
    startTransition(async () => {
      const result = await approveConsultRequest(request.id);
      // A request that has gone leaves the list, so its row can't show why.
      if (result.gone) toast(result.error ?? "", { problem: true });
      else if (result.error) setError(result.error);
      else toast(`Booked: ${patient.name}, ${request.when}`);
    });
  }

  return (
    <li className="flex flex-col gap-3.5 px-4 py-4 @lg:flex-row @lg:items-center @lg:gap-5 @md:px-5">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar initials={patient.initials} tone={patient.avatarTone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-5 text-body">
            <Link href={`/patients/${patient.id}`} className="font-bold text-ink hover:underline">
              {patient.name}
            </Link>
            {request.about ? <span className="text-[13px] text-muted"> · {request.about}</span> : null}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink">
            <CalendarClock aria-hidden className="size-3.5 text-brand-deep" />
            <span className="font-bold tabular-nums">{request.when}</span>
            {request.inHowLong ? <span className="text-body">· {request.inHowLong}</span> : null}
          </p>
          {request.reason ? <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-body">{request.reason}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {request.warning ? (
              <Chip tone="warning" icon={TriangleAlert}>
                {request.warning}
              </Chip>
            ) : null}
            <span className="text-xs text-muted">Asked {request.askedAgo}</span>
          </div>
          {error ? <DialogError>{error}</DialogError> : null}
        </div>
      </div>
      <div className="flex gap-2 *:flex-1 @lg:shrink-0 @lg:*:flex-none">
        <button type="button" onClick={() => setDeclining(true)} disabled={pending} className="btn btn-secondary btn-sm">
          Decline
        </button>
        <button type="button" onClick={approve} disabled={pending} className="btn btn-primary btn-sm">
          <Check aria-hidden className="size-4" />
          {pending ? "Booking…" : "Approve"}
        </button>
      </div>
      {declining ? (
        <DeclineDialog
          request={request}
          onClose={() => setDeclining(false)}
          onDeclined={(problem) => {
            setDeclining(false);
            if (problem) toast(problem, { problem: true });
            else toast(`Declined. ${patient.firstName} has been told.`);
          }}
        />
      ) : null}
    </li>
  );
}

function DeclineDialog({
  request,
  onClose,
  onDeclined,
}: {
  request: ConsultRequest;
  onClose: () => void;
  /** With the reason when the request had already gone. */
  onDeclined: (problem?: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [note, setNote] = useState("");
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
      const result = await declineConsultRequest(request.id, note);
      if (result.gone) onDeclined(result.error);
      else if (result.error) setError(result.error);
      else onDeclined();
    });
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={`${id}-title`} className={dialogClass}>
      <form onSubmit={submit}>
        <DialogHeader titleId={`${id}-title`} title="Decline this request?" icon={CalendarX} tone="danger" onClose={onClose} />
        <DialogBody>
          <p>
            <span className="font-semibold text-ink">{request.patient.name}</span> asked for {request.when}. Nothing is
            booked, and they can pick one of your open slots instead.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => setNote(text)}
                aria-pressed={note === text}
                className="chip min-h-9 whitespace-normal px-3.5 py-1.5 text-left text-xs leading-snug"
              >
                {text}
              </button>
            ))}
          </div>
          <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            Note (optional)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={3}
              aria-describedby={`${id}-hint`}
              placeholder="Pick one above or write your own."
              className="field"
            />
          </label>
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
            The patient will see this.
          </p>
          {error ? <DialogError>{error}</DialogError> : null}
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Keep it
          </button>
          <button type="submit" disabled={pending} className="btn btn-danger">
            {pending ? "Declining…" : "Decline request"}
          </button>
        </DialogFooter>
      </form>
    </dialog>
  );
}
