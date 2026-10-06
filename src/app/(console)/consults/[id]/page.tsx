import { ChevronLeft, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConsultPanel } from "@/components/consult/consult-panel";
import { ConsultStage } from "@/components/consult/consult-stage";
import { AccessGate } from "@/components/record/access-gate";
import { Card, Chip } from "@/components/ui";
import { getConsult } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { ageAndSex } from "@/lib/patient-text";

export const metadata: Metadata = { title: "Consult" };

export default async function ConsultPage(props: PageProps<"/consults/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  const found = await getConsult(id);
  if (!found) notFound();
  const { consult, record } = found;
  const { patient } = consult;
  const about = ageAndSex(patient);

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Today
      </Link>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">Consult with {patient.name}</h1>
      <p className="mt-1 text-body">
        {consult.day}, {consult.time}. {consult.mode}.
      </p>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <ConsultStage
            consultId={consult.id}
            startedAt={consult.startedAt}
            patientName={patient.name}
            patientInitials={patient.initials}
            doctorInitials={doctor.initials}
            status={consult.status}
            recordShared={patient.access.status === "active"}
            time={consult.time}
          />
          <Card>
            <h2 className="text-sm font-bold text-ink">Reason for the consult</h2>
            <p className="mt-1 text-ink">{consult.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {about ? <Chip tone="neutral">{about}</Chip> : null}
              {patient.bloodGroup ? <Chip tone="neutral">Blood group {patient.bloodGroup}</Chip> : null}
              {patient.allergies.map((allergy) => (
                <Chip key={allergy} tone="danger" icon={TriangleAlert}>
                  Allergy: {allergy}
                </Chip>
              ))}
              <Link href={`/patients/${patient.id}`} className="ml-auto text-sm font-bold text-brand hover:underline">
                Open full record
              </Link>
            </div>
          </Card>
        </div>

        <div className="min-w-0">
          <AccessGate patient={patient} nominee={found.nominee}>
            {record ? (
              <ConsultPanel
                record={record}
                memberId={patient.id}
                consultId={consult.id}
                patientName={patient.firstName}
                doctorName={doctor.shortName}
                allergyTerms={found.allergyTerms}
              />
            ) : null}
          </AccessGate>
        </div>
      </div>
    </>
  );
}
