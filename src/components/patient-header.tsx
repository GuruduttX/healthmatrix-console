import { BadgeCheck, TriangleAlert, Video } from "lucide-react";
import Link from "next/link";

import { bleed } from "@/components/hero";
import { BackLink, StackBar } from "@/components/stack-bar";
import { Avatar } from "@/components/ui";
import { demographics } from "@/lib/patient-text";
import type { Consult, Patient } from "@/lib/types";

/** Pills on the dark header, each in its tone. */
const pill = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold";
const pills = {
  danger: `${pill} border-[#ffb48f]/35 bg-danger/40 text-[#ffe1d3]`,
  warning: `${pill} border-[#f5c46b]/30 bg-[#b5780a]/30 text-[#ffe9bf]`,
  glass: `${pill} glass text-white`,
};

/** Brand green, lifted so it reads on ink, as in the app. */
const ABHA_GREEN = "text-[#7fd6c2]";

/**
 * Identity and alerts, on the dark header the app gives a profile. Shown before the record is
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
      <StackBar tone="dark" back={back} title={patient.name} revealId="patient-name" />
      <BackLink href={back.href} label={back.label} />

      <header
        className={`hero-bg relative overflow-hidden rounded-b-[2rem] px-4 pt-[calc(env(safe-area-inset-top)+4.25rem)] text-white sm:px-6 lg:rounded-3xl lg:px-8 lg:pt-7 print:hidden ${bleed} ${
          compact ? "pb-5 lg:pb-6" : "pb-6 lg:pb-7"
        }`}
      >
        <div
          className={`relative flex gap-x-5 gap-y-3 ${
            compact ? "items-start lg:items-center" : "flex-col items-center text-center lg:flex-row lg:text-left"
          }`}
        >
          <span className="shrink-0 rounded-full bg-white/14 p-1">
            <Avatar initials={patient.initials} tone={patient.avatarTone} size={compact ? "lg" : "xl"} />
          </span>

          <div className="min-w-0 flex-1">
            <h1
              id="patient-name"
              className={`font-display font-bold tracking-[-0.01em] ${compact ? "text-xl leading-7 lg:text-2xl" : "text-2xl leading-8 lg:text-[1.75rem] lg:leading-9"}`}
            >
              {patient.name}
            </h1>
            <p
              className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-white/70 ${compact ? "" : "justify-center lg:justify-start"}`}
            >
              <span>{demographics(patient, { bloodGroupLabel: "Blood group " })}</span>
              <span aria-hidden className="hidden text-white/30 lg:inline">
                ·
              </span>
              <span className={`font-semibold tabular-nums text-white/90 ${compact ? "" : "max-lg:basis-full"}`}>{patient.memberId}</span>
              {patient.abhaLinked ? (
                <span className={`inline-flex items-center gap-1 font-semibold ${ABHA_GREEN}`}>
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
              className={`btn btn-primary shrink-0 shadow-[0_8px_20px_rgba(221,67,1,0.45)] ${compact ? "btn-sm max-lg:hidden" : "mt-2 w-full lg:mt-0 lg:w-auto"}`}
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
