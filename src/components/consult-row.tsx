import { ArrowRight, MonitorSmartphone, Video } from "lucide-react";
import Link from "next/link";

import { AccessChip, Avatar, Chip } from "@/components/ui";
import { ageAndSex } from "@/lib/patient-text";
import type { Consult, ConsultStatus, Tone } from "@/lib/types";

const consultStatus: Record<ConsultStatus, { label: string; tone: Tone; action: string }> = {
  completed: { label: "Done", tone: "neutral", action: "Review" },
  in_progress: { label: "In consult", tone: "brand", action: "Join consult" },
  scheduled: { label: "Upcoming", tone: "neutral", action: "Open consult" },
};

export function ConsultRow({ consult }: { consult: Consult }) {
  const { patient } = consult;
  const about = ageAndSex(patient);
  const status = consultStatus[consult.status];
  const live = consult.status === "in_progress";

  return (
    <li
      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 sm:flex sm:flex-wrap sm:items-start sm:gap-x-4 sm:px-5 ${live ? "bg-brand-soft" : ""}`}
    >
      {/* Phones: time and status share the top line, so the name and reason get the full width. */}
      <div className="col-span-2 flex items-center justify-between gap-3 sm:w-20 sm:shrink-0 sm:pt-2.5">
        <span className="text-sm font-bold text-ink">{consult.time}</span>
        <span className="sm:hidden">
          <Chip tone={status.tone}>{status.label}</Chip>
        </span>
      </div>
      <Avatar initials={patient.initials} tone={patient.avatarTone} />
      <div className="min-w-0 sm:min-w-48 sm:flex-1">
        <p className="text-body">
          <Link href={`/patients/${patient.id}`} className="font-semibold text-ink hover:underline">
            {patient.name}
          </Link>
          {about ? `, ${about}` : null}
        </p>
        <p className="text-sm text-body">{consult.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline-flex">
            <Chip tone={status.tone}>{status.label}</Chip>
          </span>
          <AccessChip status={patient.access.status} />
          <span className="flex items-center gap-1.5 text-xs text-body">
            {consult.mode === "Video" ? (
              <Video aria-hidden className="size-3.5" />
            ) : (
              <MonitorSmartphone aria-hidden className="size-3.5" />
            )}
            {consult.mode}
          </span>
        </div>
      </div>
      <Link
        href={`/consults/${consult.id}`}
        className={`col-span-2 inline-flex items-center justify-center gap-1.5 self-center rounded-full px-4 py-2.5 text-sm font-bold sm:w-auto sm:py-2 ${
          live ? "bg-brand text-white hover:bg-danger" : "border border-line bg-card text-ink hover:bg-selected"
        }`}
      >
        {status.action}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </li>
  );
}
