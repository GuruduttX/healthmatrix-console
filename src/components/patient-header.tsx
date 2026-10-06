import { BadgeCheck, ChevronLeft, TriangleAlert, Video } from "lucide-react";
import Link from "next/link";

import { Avatar, Chip } from "@/components/ui";
import { demographics } from "@/lib/patient-text";
import type { Consult, Patient } from "@/lib/types";

/** Identity and alerts. Shown before the record is unlocked, so it carries no history. */
export function PatientHeader({
  patient,
  consult,
  back,
}: {
  patient: Patient;
  /** Today's consult with this patient, if there is one. */
  consult?: Pick<Consult, "id" | "time" | "status">;
  back: { href: string; label: string };
}) {
  return (
    <>
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        {back.label}
      </Link>

      {/* Phones: avatar beside the name, then details, alerts and the action each on a full-width row. */}
      <header className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-5">
        <Avatar initials={patient.initials} tone={patient.avatarTone} size="lg" />
        <div className="contents sm:block sm:min-w-0 sm:flex-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{patient.name}</h1>
          <p className="col-span-2 flex flex-wrap items-center gap-x-2 text-sm text-body sm:mt-1">
            {demographics(patient, { bloodGroupLabel: "Blood group " })}
            <span className="font-medium text-ink">{patient.memberId}</span>
            {patient.abhaLinked ? (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <BadgeCheck aria-hidden className="size-4" />
                ABHA linked
              </span>
            ) : null}
          </p>
          <div className="col-span-2 flex flex-wrap gap-2 sm:mt-2.5">
            {patient.allergies.map((allergy) => (
              <Chip key={allergy} tone="danger" icon={TriangleAlert}>
                Allergy: {allergy}
              </Chip>
            ))}
            {patient.conditions.map((condition) => (
              <Chip key={condition} tone="warning">
                {condition}
              </Chip>
            ))}
            {consult ? (
              <Chip tone="neutral">
                {consult.status === "completed" ? "Seen" : "Consult"} today, {consult.time}
              </Chip>
            ) : null}
          </div>
        </div>
        {consult && consult.status !== "completed" ? (
          <Link
            href={`/consults/${consult.id}`}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-danger sm:py-2.5"
          >
            <Video aria-hidden className="size-4" />
            {consult.status === "in_progress" ? "Join consult" : "Open consult"}
          </Link>
        ) : null}
      </header>
    </>
  );
}
