import { FileSignature, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatientHeader } from "@/components/patient-header";
import { AccessGate } from "@/components/record/access-gate";
import { AskRecord } from "@/components/record/ask-record";
import { PatientRecordCards } from "@/components/record/patient-record-cards";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { Card, CardTitle } from "@/components/ui";
import { getPatient, getPatientRecord, getVaccineSchedule } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";

export async function generateMetadata(props: PageProps<"/patients/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: (await getPatient(id))?.patient.name ?? "Patient" };
}

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

      <div className="mt-6">
        <AccessGate patient={patient} nominee={found.nominee}>
          {record ? (
            <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
              <PatientRecordCards patient={patient} record={record} vaccines={vaccines} />

            <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:items-stretch">
              <Card>
                <CardTitle icon={MessageSquareText}>Ask the record</CardTitle>
                <AskRecord />
              </Card>

              <Card>
                <CardTitle icon={FileSignature}>Prescription</CardTitle>
                <PrescriptionDraft
                  prescriptionId={record.draft?.id}
                  memberId={patient.id}
                  items={record.draft?.items ?? []}
                  vaccines={record.draft?.vaccines}
                  patientName={patient.firstName}
                  doctorName={doctor.shortName}
                  allergyTerms={found.allergyTerms}
                />
              </Card>
            </div>
          </div>
          ) : null}
        </AccessGate>
      </div>
    </>
  );
}
