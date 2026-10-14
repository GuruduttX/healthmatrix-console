import { ChevronRight, MonitorSmartphone, UserCheck, Video } from "lucide-react";
import Link from "next/link";

import { CancelConsultButton } from "@/components/schedule/cancel-consult";
import { AccessChip, Chip } from "@/components/ui";
import { ageAndSex } from "@/lib/patient-text";
import type { Consult, ConsultStatus, Tone } from "@/lib/types";

const consultStatus: Record<ConsultStatus, { label: string; tone: Tone; action: string }> = {
  completed: { label: "Done", tone: "neutral", action: "Review" },
  in_progress: { label: "In consult", tone: "success", action: "Join" },
  scheduled: { label: "Upcoming", tone: "neutral", action: "Open" },
};

/** "10:35 am" → ["10:35", "am"], for the time chip. */
function splitTime(time: string) {
  const at = time.lastIndexOf(" ");
  return at > 0 ? [time.slice(0, at), time.slice(at + 1)] : [time, ""];
}

/**
 * One consult in a day's list: the time on a chip down the left, like the app's records
 * timeline, who and why in the middle, and the one thing to do. A call in progress, or a
 * patient waiting to be let in, is tinted and gets the orange button.
 */
export function ConsultRow({ consult }: { consult: Consult }) {
  const { patient } = consult;
  const about = ageAndSex(patient);
  const live = consult.status === "in_progress";
  const waiting = consult.status === "scheduled" && !!consult.patientWaiting;
  const done = consult.status === "completed";
  const status = waiting ? { label: "In waiting room", tone: "brand" as Tone } : consultStatus[consult.status];
  const urgent = live || waiting;
  const ModeIcon = consult.mode === "Video" ? Video : MonitorSmartphone;
  const [clock, half] = splitTime(consult.time);
  const action = waiting ? "Admit" : consultStatus[consult.status].action;
  // Admit here lets the patient in: the consult page admits on arrival, no second click.
  const href = `/consults/${consult.id}${waiting ? "?admit=1" : ""}`;

  return (
    <li className={`relative flex gap-3 px-4 py-3.5 sm:items-center sm:gap-4 sm:px-5 ${urgent ? "bg-brand-soft/70" : ""}`}>
      {urgent ? <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-brand" /> : null}

      <Link
        href={href}
        aria-label={`${consult.time}, ${action} consult with ${patient.name}`}
        className={`flex w-13 shrink-0 flex-col items-center self-start rounded-xl border py-1.5 text-center shadow-[0_1px_2px_rgba(14,42,51,0.05)] sm:self-center ${
          urgent ? "border-brand/25 bg-card" : "border-line bg-card"
        }`}
      >
        <span className={`font-display text-[15px] font-bold leading-5 tabular-nums ${done ? "text-muted" : "text-ink"}`}>{clock}</span>
        <span className="text-[10px] font-bold uppercase leading-3 tracking-[0.06em] text-muted">{half}</span>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[15px] leading-5 text-body">
            <Link href={`/patients/${patient.id}`} className="font-bold text-ink hover:underline">
              {patient.name}
            </Link>
            {about ? <span className="hidden text-[13px] text-muted sm:inline"> · {about}</span> : null}
          </p>
          <span className="shrink-0 sm:hidden">
            <Chip tone={status.tone} dot>
              {status.label}
            </Chip>
          </span>
        </div>
        {about ? <p className="text-xs text-muted sm:hidden">{about}</p> : null}
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-body sm:line-clamp-1">{consult.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <AccessChip status={patient.access.status} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <ModeIcon aria-hidden className="size-3.5" />
            {consult.mode}
          </span>
          {consult.status === "scheduled" ? (
            <CancelConsultButton consultId={consult.id} patientName={patient.name} when={`${consult.day}, ${consult.time}`} />
          ) : null}
          {/* Phones: a quiet way in for rows that aren't waiting on the doctor. */}
          {urgent ? null : (
            <Link href={href} className="ml-auto inline-flex items-center gap-0.5 text-[13px] font-bold text-brand sm:hidden">
              {action}
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          )}
        </div>
        {urgent ? (
          <Link href={href} className="btn btn-primary btn-sm mt-3 w-full sm:hidden">
            {waiting ? <UserCheck aria-hidden className="size-4" /> : <Video aria-hidden className="size-4" />}
            {waiting ? `Admit ${patient.firstName}` : "Join the call"}
          </Link>
        ) : null}
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <Chip tone={status.tone} dot>
          {status.label}
        </Chip>
        <Link href={href} className={`btn btn-sm ${urgent ? "btn-primary" : done ? "btn-ghost" : "btn-secondary"}`}>
          {waiting ? <UserCheck aria-hidden className="size-4" /> : live ? <Video aria-hidden className="size-4" /> : null}
          {action}
          {urgent ? null : <ChevronRight aria-hidden className="-mr-1 size-4 text-muted" />}
        </Link>
      </div>
    </li>
  );
}
