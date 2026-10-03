import { BadgeCheck, ChevronLeft, TriangleAlert, Video } from "lucide-react";
import Link from "next/link";

import { Avatar, Chip } from "@/components/ui";
import { getConsultFor, planNames } from "@/lib/data";
import type { Patient } from "@/lib/types";

/** Identity and alerts. Shown before the record is unlocked, so it carries no history. */
export function PatientHeader({ patient, back }: { patient: Patient; back: { href: string; label: string } }) {
  const consult = getConsultFor(patient.id);

  return (
    <>
      <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        {back.label}
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Avatar initials={patient.initials} tone={patient.avatarTone} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold text-ink">{patient.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-body">
            {patient.age} years, {patient.sex}. Blood group {patient.bloodGroup}. {planNames[patient.plan]} plan.
            <span className="font-medium text-ink">{patient.memberId}</span>
            {patient.abhaLinked ? (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <BadgeCheck aria-hidden className="size-4" />
                ABHA linked
              </span>
            ) : null}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
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
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-danger"
          >
            <Video aria-hidden className="size-4" />
            {consult.status === "in_progress" ? "Join consult" : "Open consult"}
          </Link>
        ) : null}
      </header>
    </>
  );
}
