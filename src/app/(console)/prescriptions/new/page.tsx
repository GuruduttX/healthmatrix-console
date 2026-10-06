import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PrescriptionComposer } from "@/components/prescription-composer";
import { getPrescriptionPatients } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";

export const metadata: Metadata = { title: "New prescription" };

export default async function NewPrescriptionPage(props: PageProps<"/prescriptions/new">) {
  const doctor = await getCurrentDoctor();
  const { patient } = await props.searchParams;

  // Only patients whose record is open: the safety checks need their allergies and medicines.
  const options = await getPrescriptionPatients();

  return (
    <>
      <Link href="/prescriptions" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Prescriptions
      </Link>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">New prescription</h1>
      <p className="mt-2 max-w-2xl text-body">
        Type the medicines, tests and advice. Each line is checked against the patient’s allergies
        before you can sign.
      </p>

      <PrescriptionComposer
        options={options}
        initialPatientId={typeof patient === "string" ? patient : undefined}
        doctorName={doctor.shortName}
      />
    </>
  );
}
