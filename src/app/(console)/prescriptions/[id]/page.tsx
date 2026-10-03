import { ChevronLeft, CircleCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { Chip } from "@/components/ui";
import { getAllergyTerms, getPatient, getPrescription } from "@/lib/data";
import { getCurrentDoctor } from "@/lib/doctor-view";

export const metadata: Metadata = { title: "Prescription" };

export default async function PrescriptionPage(props: PageProps<"/prescriptions/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  const rx = getPrescription(id);
  const patient = rx ? getPatient(rx.patientId) : undefined;
  if (!rx || !patient) notFound();

  const signed = rx.status === "signed";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/prescriptions" className="inline-flex items-center gap-1 text-sm font-semibold text-body hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" />
          Prescriptions
        </Link>
        {signed ? <PrintButton /> : null}
      </div>

      <article className="mx-auto mt-4 max-w-2xl rounded-2xl border border-line bg-card p-8 shadow-card">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-display text-xl font-bold text-ink">{doctor.name}</p>
            <p className="text-sm text-body">
              {[doctor.qualifications, doctor.specialty].filter(Boolean).join(". ")}.
            </p>
            <p className="text-sm text-body">
              Reg. no. {[doctor.registrationNumber, doctor.council].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="" width={28} height={25} />
            <span className="font-display text-lg font-bold text-ink">HealthMatrix</span>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-ink">
              <Link href={`/patients/${patient.id}`} className="hover:underline">
                {patient.name}
              </Link>
            </h1>
            <p className="text-sm text-body">
              {patient.age} years, {patient.sex}. {patient.memberId}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Chip tone={signed ? "success" : "warning"} icon={signed ? CircleCheck : undefined}>
              {signed ? "Signed" : "Draft, not yet sent"}
            </Chip>
            <span className="text-sm text-body">{rx.date}</span>
          </div>
        </div>

        {patient.allergies.length > 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-danger">
            <TriangleAlert aria-hidden className="size-4" />
            Allergy: {patient.allergies.join(", ")}
          </p>
        ) : null}

        {signed ? (
          <>
            <ol className="mt-5 divide-y divide-line border-t border-line">
              {rx.items.map((item, i) => (
                <li key={item} className="flex gap-3 py-3 text-ink">
                  <span className="w-4 shrink-0 font-bold text-brand">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-body">
              Signed digitally by {doctor.shortName}. Given under India’s Telemedicine Practice
              Guidelines, 2020.
            </p>
          </>
        ) : (
          <PrescriptionDraft
            items={rx.items}
            patientName={patient.firstName}
            doctorName={doctor.shortName}
            allergyTerms={getAllergyTerms(patient)}
          />
        )}
      </article>
    </>
  );
}
