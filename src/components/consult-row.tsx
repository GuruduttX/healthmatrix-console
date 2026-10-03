import { ArrowRight, MonitorSmartphone, Video } from "lucide-react";
import Link from "next/link";

import { AccessChip, Avatar, Chip } from "@/components/ui";
import { getPatient } from "@/lib/data";
import type { Consult, ConsultStatus, Tone } from "@/lib/types";

const consultStatus: Record<ConsultStatus, { label: string; tone: Tone; action: string }> = {
  completed: { label: "Done", tone: "neutral", action: "Review" },
  in_progress: { label: "In consult", tone: "brand", action: "Join consult" },
  scheduled: { label: "Upcoming", tone: "neutral", action: "Open consult" },
};

export function ConsultRow({ consult }: { consult: Consult }) {
  const patient = getPatient(consult.patientId)!;
  const status = consultStatus[consult.status];
  const live = consult.status === "in_progress";

  return (
    <li className={`flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4 ${live ? "bg-brand-soft" : ""}`}>
      <span className="w-20 shrink-0 pt-2.5 text-sm font-bold text-ink">{consult.time}</span>
      <Avatar initials={patient.initials} tone={patient.avatarTone} />
      <div className="min-w-48 flex-1">
        <p className="text-body">
          <Link href={`/patients/${patient.id}`} className="font-semibold text-ink hover:underline">
            {patient.name}
          </Link>
          , {patient.age}, {patient.sex}
        </p>
        <p className="text-sm text-body">{consult.reason}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip tone={status.tone}>{status.label}</Chip>
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
        className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-sm font-bold ${
          live ? "bg-brand text-white hover:bg-danger" : "border border-line bg-card text-ink hover:bg-selected"
        }`}
      >
        {status.action}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </li>
  );
}
