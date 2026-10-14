import type { Metadata } from "next";

import { PrescriptionComposer } from "@/components/prescription-composer";
import { PageHeader } from "@/components/ui";
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
      <PageHeader
        back={{ href: "/prescriptions", label: "Prescriptions" }}
        title="New prescription"
        description="Type the medicines, tests and advice. Each line is checked against the patient’s allergies before you can sign."
      />

      <PrescriptionComposer
        options={options}
        initialPatientId={typeof patient === "string" ? patient : undefined}
        doctorName={doctor.shortName}
      />
    </>
  );
}
