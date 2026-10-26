import { CalendarX2, ChevronDown, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConsultPanel } from "@/components/consult/consult-panel";
import { ConsultStage } from "@/components/consult/consult-stage";
import { AccessGate } from "@/components/record/access-gate";
import { EkaaySummary } from "@/components/record/ekaay-summary";
import { PatientRecordCards } from "@/components/record/patient-record-cards";
import { Card, Chip, PageHeader, PanelLink, Section } from "@/components/ui";
import { getConsult, getVaccineSchedule } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { ekaayReady } from "@/lib/ekaay";
import { LATE_START_MINUTES } from "@/lib/schedule";
import { ageAndSex } from "@/lib/patient-text";
import { videoReady } from "@/lib/video";

export const metadata: Metadata = { title: "Consult" };

/**
 * In place of the video stage for a booked consult nobody started in time. The page reads itself
 * again every half minute, so an open waiting room turns into this at the mark.
 */
function MissedConsult({ firstName, time }: { firstName: string; time: string }) {
  return (
    <section className="glass-panel rounded-3xl px-6 py-8 text-center sm:py-10">
      <span aria-hidden className="mx-auto inline-flex size-19 items-center justify-center rounded-full bg-white/60">
        <span className="glass-small inline-flex size-13.5 items-center justify-center rounded-full text-muted">
          <CalendarX2 className="size-6" />
        </span>
      </span>
      <h2 className="mt-4 font-display text-[1.375rem] font-semibold tracking-[-0.01em] text-ink">Missed</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-body">
        This consult, booked for {time}, wasn’t started within {LATE_START_MINUTES} minutes of its time, so it has moved to
        past consults. It can’t be joined or started now. {firstName} can book another time in the app.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-secondary">
          Back to Today
        </Link>
      </div>
    </section>
  );
}

export default async function ConsultPage(props: PageProps<"/consults/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  // `?admit=1`: opened from an Admit button on Today or Schedule, so that click lets the patient in.
  const { admit } = await props.searchParams;
  const found = await getConsult(id);
  if (!found) notFound();
  const { consult, record } = found;
  const { patient } = consult;
  const about = ageAndSex(patient);
  const vaccines = record ? await getVaccineSchedule(patient.id) : [];

  return (
    <>
      <PageHeader
        back={{ href: "/", label: "Today" }}
        eyebrow={`${consult.mode} consult`}
        title={patient.name}
        barTitle="Consult"
        description={`${consult.day}, ${consult.time}${about ? ` · ${about}` : ""}`}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          {consult.missed ? (
            <MissedConsult firstName={patient.firstName} time={consult.time} />
          ) : (
            <ConsultStage
              consultId={consult.id}
              startedAt={consult.startedAt}
              patientName={patient.name}
              patientInitials={patient.initials}
              status={consult.status}
              recordShared={patient.access.status === "active"}
              time={consult.time}
              videoReady={videoReady()}
              admitOnOpen={admit === "1" && consult.status === "scheduled"}
            />
          )}
          <Card>
            <h2 className="text-xs font-bold text-muted">Reason for the consult</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{consult.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {patient.bloodGroup ? <Chip tone="neutral">Blood group {patient.bloodGroup}</Chip> : null}
              {patient.allergies.map((allergy) => (
                <Chip key={allergy} tone="danger" icon={TriangleAlert}>
                  Allergy: {allergy}
                </Chip>
              ))}
              {/* The record opens further down this page, so the call stays where it is. */}
              {record ? (
                <a href="#full-record" className="btn btn-soft btn-sm max-sm:mt-1.5 max-sm:w-full sm:ml-auto">
                  Open full record
                  <ChevronDown aria-hidden className="size-4" />
                </a>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="min-w-0">
          <AccessGate patient={patient} nominee={found.nominee}>
            {record ? (
              <ConsultPanel
                record={record}
                summary={
                  <EkaaySummary memberId={patient.id} patientName={patient.firstName} lines={record.summary} className="mt-4" />
                }
                memberId={patient.id}
                consultId={consult.id}
                patientName={patient.firstName}
                doctorName={doctor.shortName}
                allergyTerms={found.allergyTerms}
                askReady={ekaayReady()}
                initialTab={consult.status === "completed" ? "Prescription" : "Summary"}
              />
            ) : null}
          </AccessGate>
        </div>
      </div>

      {record ? (
        <Section
          id="full-record"
          title={`${patient.firstName}’s full record`}
          action={<PanelLink href={`/patients/${patient.id}`}>Own page</PanelLink>}
          className="mt-9 scroll-mt-[calc(env(safe-area-inset-top)+4.5rem)] lg:scroll-mt-20"
        >
          {/* The summary is already in the panel beside the call. */}
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <PatientRecordCards patient={patient} record={record} vaccines={vaccines} summary={false} />
          </div>
        </Section>
      ) : null}
    </>
  );
}
