import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PrescriptionComposer } from "@/components/prescription-composer";
import { doctor, getAllergyTerms, getRecord, patients } from "@/lib/data";

export const metadata: Metadata = { title: "New prescription" };

export default async function NewPrescriptionPage(props: PageProps<"/prescriptions/new">) {
  const { patient } = await props.searchParams;

  // Only patients whose record is open: the safety checks need their allergies and medicines.
  const options = patients
    .filter((p) => p.access.status === "active")
    .map((p) => ({
      id: p.id,
      name: p.name,
      firstName: p.firstName,
      allergies: p.allergies,
      allergyTerms: getAllergyTerms(p),
      medicines: getRecord(p.id).medicines,
      sampleDraft: getRecord(p.id).prescriptionDraft,
    }));

  return (
    <>
      <Link href="/prescriptions" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Prescriptions
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">New prescription</h1>
      <p className="mt-2 max-w-2xl text-body">
        Dictate, photograph a handwritten note, or type. Ekaay drafts it and checks it against the
        patient’s allergies before you sign.
      </p>

      <PrescriptionComposer
        options={options}
        initialPatientId={typeof patient === "string" ? patient : undefined}
        doctorName={doctor.shortName}
      />
    </>
  );
}
