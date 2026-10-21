import { BadgeCheck, TriangleAlert, Video } from "lucide-react";
import Link from "next/link";

import { BackLink, StackBar } from "@/components/stack-bar";
import { Avatar } from "@/components/ui";
import { demographics } from "@/lib/patient-text";
import type { Consult, Patient } from "@/lib/types";

/** Pills on the card, each in its tone: see-through tints, as the app's flag pills. */
const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
const pills = {
  danger: `${pill} border border-white/85 bg-danger-soft text-danger`,
  warning: `${pill} border border-white/85 bg-warning-soft text-warning`,
  glass: `${pill} glass-flat text-ink-mid`,
};

/**
 * Identity and alerts, on a pane of glass as the app's profile cards. Shown before the record is
 * unlocked, so it carries no history. Phones: centred under a bar with a round back button.
 * `compact`: a smaller, left-aligned version for a single record's screen.
 */
export function PatientHeader({
  patient,
  consult,
  back,
  compact = false,
}: {
  patient: Patient;
  /** Today's consult with this patient, if there is one. */
  consult?: Pick<Consult, "id" | "time" | "status">;
  back: { href: string; label: string };
  compact?: boolean;
}) {
  const live = consult?.status === "in_progress";
  const hasChips = patient.allergies.length > 0 || patient.conditions.length > 0 || Boolean(consult);

  return (
    <>
      <StackBar back={back} title={patient.name} revealId="patient-name" />
      <BackLink href={back.href} label={back.label} />

      <header
        className={`glass-panel mt-2 rounded-2xl px-4 sm:px-6 lg:mt-0 lg:px-7 print:hidden ${compact ? "py-4 lg:py-5" : "py-5 lg:py-6"}`}
      >
        <div
          className={`flex gap-x-5 gap-y-3 ${
            compact ? "items-start lg:items-center" : "flex-col items-center text-center lg:flex-row lg:text-left"
          }`}
        >
          <span className="shrink-0 rounded-full bg-white/70 p-1 shadow-[0_1px_2px_rgba(30,50,70,0.06),0_6px_14px_rgba(30,50,70,0.1)]">
            <Avatar initials={patient.initials} tone={patient.avatarTone} size={compact ? "lg" : "xl"} />
          </span>

          <div className="min-w-0 flex-1">
            <h1
              id="patient-name"
              className={`font-display font-semibold tracking-[-0.015em] text-ink ${compact ? "text-xl leading-7 lg:text-2xl" : "text-2xl leading-8 lg:text-[1.75rem] lg:leading-9"}`}
            >
              {patient.name}
            </h1>
            <p
              className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-body ${compact ? "" : "justify-center lg:justify-start"}`}
            >
              <span>{demographics(patient, { bloodGroupLabel: "Blood group " })}</span>
              <span aria-hidden className="hidden text-muted lg:inline">
                ·
              </span>
              <span className={`font-semibold tabular-nums text-ink-mid ${compact ? "" : "max-lg:basis-full"}`}>{patient.memberId}</span>
              {patient.abhaLinked ? (
                <span className="inline-flex items-center gap-1 font-semibold text-success">
                  <BadgeCheck aria-hidden className="size-4" />
                  ABHA linked
                </span>
              ) : null}
            </p>
            {hasChips ? (
              <div className={`mt-3 flex flex-wrap gap-1.5 ${compact ? "" : "justify-center lg:justify-start"}`}>
                {patient.allergies.map((allergy) => (
                  <span key={allergy} className={pills.danger}>
                    <TriangleAlert aria-hidden className="size-3.5" />
                    Allergy: {allergy}
                  </span>
                ))}
                {patient.conditions.map((condition) => (
                  <span key={condition} className={pills.warning}>
                    {condition}
                  </span>
                ))}
                {consult ? (
                  <span className={pills.glass}>
                    {consult.status === "completed" ? "Seen" : "Consult"} today, {consult.time}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {consult && consult.status !== "completed" ? (
            <Link
              href={`/consults/${consult.id}`}
              className={`btn btn-primary shrink-0 ${compact ? "btn-sm max-lg:hidden" : "mt-2 w-full lg:mt-0 lg:w-auto"}`}
            >
              <Video aria-hidden className="size-4" />
              {live ? "Join consult" : "Open consult"}
            </Link>
          ) : null}
        </div>
      </header>
    </>
  );
}
