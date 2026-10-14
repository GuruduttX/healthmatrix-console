import { CircleCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { VaccineSchedule } from "@/components/record/vaccine-schedule";
import { BackLink, StackBar } from "@/components/stack-bar";
import { Chip } from "@/components/ui";
import { getPrescription } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { ageAndSex } from "@/lib/patient-text";

export const metadata: Metadata = { title: "Prescription" };

export default async function PrescriptionPage(props: PageProps<"/prescriptions/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  const found = await getPrescription(id);
  if (!found) notFound();
  const { rx, signedAt } = found;
  const { patient } = rx;
  const about = ageAndSex(patient);

  const signed = rx.status === "signed";

  return (
    <>
      <StackBar
        back={{ href: "/prescriptions", label: "Prescriptions" }}
        title={signed ? "Prescription" : "Draft prescription"}
        right={signed ? <PrintButton compact /> : undefined}
      />
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 print:hidden">
        <BackLink href="/prescriptions" label="Prescriptions" />
        {signed ? (
          <span className="hidden lg:block">
            <PrintButton />
          </span>
        ) : null}
      </div>

      <article className="mx-auto mt-2 max-w-2xl rounded-xl border border-line bg-card p-5 shadow-raised sm:p-10 lg:mt-1 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-display text-lg font-bold tracking-[-0.01em] text-ink">{doctor.name}</p>
            <p className="text-[13px] text-body">
              {[doctor.qualifications, doctor.specialty].filter(Boolean).join(". ")}.
            </p>
            <p className="text-[13px] text-muted">
              Reg. no. {[doctor.registrationNumber, doctor.council].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="" width={28} height={25} />
            <span className="font-display text-base font-bold tracking-[-0.01em] text-ink">HealthMatrix</span>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 id="page-title" className="font-display text-lg font-bold text-ink">
              <Link href={`/patients/${patient.id}`} className="hover:underline">
                {patient.name}
              </Link>
            </h1>
            <p className="text-[13px] text-body">
              {about ? `${about}. ` : ""}
              {patient.memberId}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
            <Chip tone={signed ? "success" : "warning"} icon={signed ? CircleCheck : undefined}>
              {signed ? "Signed" : "Draft, not yet sent"}
            </Chip>
            <span className="text-xs tabular-nums text-muted">{signedAt ?? rx.date}</span>
          </div>
        </div>

        {patient.allergies.length > 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-bold text-danger">
            <TriangleAlert aria-hidden className="size-4" />
            Allergy: {patient.allergies.join(", ")}
          </p>
        ) : null}

        {signed ? (
          <>
            <ol className="mt-5 divide-y divide-line border-t border-line">
              {rx.items.map((item, i) => (
                <li key={item} className="flex gap-3 py-3 text-sm text-ink">
                  <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
            {rx.tests.length > 0 ? (
              <section className="mt-6">
                <h2 className="mb-2 font-display text-base font-bold text-ink">Lab tests</h2>
                <ul className="divide-y divide-line border-t border-line">
                  {rx.tests.map((test) => (
                    <li key={`${test.kind}-${test.code}`} className="py-3 text-sm text-ink">
                      <span className="font-semibold">{test.name}</span>
                      <span className="text-body">
                        {test.kind === "profile" ? `, health check of ${test.tests.length} tests` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {found.vaccines.length > 0 ? (
              <section className="mt-6">
                <h2 className="mb-3 font-display text-base font-bold text-ink">Vaccines</h2>
                <VaccineSchedule vaccines={found.vaccines} />
              </section>
            ) : null}
            <p className="mt-8 border-t border-line pt-4 text-xs text-muted">
              Signed digitally by {doctor.shortName}. Given under India’s Telemedicine Practice
              Guidelines, 2020.
            </p>
          </>
        ) : (
          <PrescriptionDraft
            prescriptionId={rx.id}
            memberId={patient.id}
            consultId={found.consultId}
            items={rx.items}
            vaccines={found.draft?.vaccines}
            tests={found.draft?.tests}
            patientName={patient.firstName}
            doctorName={doctor.shortName}
            allergyTerms={found.allergyTerms}
          />
        )}
      </article>
    </>
  );
}
