import { FileSignature, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JumpNav } from "@/components/jump-nav";
import { PatientHeader } from "@/components/patient-header";
import { AccessGate } from "@/components/record/access-gate";
import { AskRecord } from "@/components/record/ask-record";
import { PatientRecordCards } from "@/components/record/patient-record-cards";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { Card, CardTitle } from "@/components/ui";
import { getPatient, getPatientRecord, getVaccineSchedule } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { ekaayReady } from "@/lib/ekaay";

export async function generateMetadata(props: PageProps<"/patients/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: (await getPatient(id))?.patient.name ?? "Patient" };
}

/** The parts of the record a doctor jumps between on a phone, in the order they come. */
const sections = [
  { id: "summary", label: "Summary" },
  { id: "medicines", label: "Medicines" },
  { id: "vaccines", label: "Vaccines" },
  { id: "timeline", label: "Timeline" },
  { id: "lab", label: "Lab tests" },
  { id: "trends", label: "Trends" },
  { id: "prescription", label: "Prescription" },
  { id: "ask", label: "Ask the record" },
];

/** Room above a card when a jump link scrolls to it. */
const anchor = "scroll-mt-[calc(env(safe-area-inset-top)+7.5rem)] lg:scroll-mt-24";

export default async function PatientPage(props: PageProps<"/patients/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  const found = await getPatient(id);
  if (!found) notFound();
  const { patient } = found;
  // Only loaded, and logged, while the patient's OTP keeps the record open.
  const record = await getPatientRecord(id);
  const vaccines = record ? await getVaccineSchedule(id) : [];

  return (
    <>
      <PatientHeader patient={patient} consult={found.todayConsult} back={{ href: "/patients", label: "Patients" }} />

      <div className="mt-5 lg:mt-6">
        <AccessGate patient={patient} nominee={found.nominee}>
          {record ? (
            <>
              <JumpNav
                label={`Parts of ${patient.firstName}’s record`}
                // Only the cards this patient has.
                items={sections.filter(
                  (s) =>
                    (s.id !== "vaccines" || vaccines.length > 0) &&
                    (s.id !== "lab" || record.labBookings.length > 0) &&
                    (s.id !== "trends" || record.charts.length > 0),
                )}
              />
              <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
                <PatientRecordCards patient={patient} record={record} vaccines={vaccines} />

                <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:items-stretch">
                  <Card id="prescription" className={anchor}>
                    <CardTitle icon={FileSignature} tile>
                      Prescription
                    </CardTitle>
                    <PrescriptionDraft
                      prescriptionId={record.draft?.id}
                      memberId={patient.id}
                      items={record.draft?.items ?? []}
                      vaccines={record.draft?.vaccines}
                      tests={record.draft?.tests}
                      patientName={patient.firstName}
                      doctorName={doctor.shortName}
                      allergyTerms={found.allergyTerms}
                    />
                  </Card>

                  <Card id="ask" className={anchor}>
                    <CardTitle icon={MessageSquareText} tile tone="neutral">
                      Ask the record
                    </CardTitle>
                    <AskRecord ready={ekaayReady()} memberId={patient.id} patientName={patient.firstName} />
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </AccessGate>
      </div>
    </>
  );
}
