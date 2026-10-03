import {
  ChevronRight,
  ClipboardList,
  FlaskConical,
  MessageSquareText,
  Mic,
  Pill,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LineChart } from "@/components/line-chart";
import { PatientHeader } from "@/components/patient-header";
import { AccessGate } from "@/components/record/access-gate";
import { AskRecord } from "@/components/record/ask-record";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { timelineIcons } from "@/components/record/timeline-icons";
import { Card, CardTitle, Chip, flagTone } from "@/components/ui";
import { getAllergyTerms, getNominee, getPatient, getRecord } from "@/lib/data";
import { getCurrentDoctor } from "@/lib/doctor-view";

export async function generateMetadata(props: PageProps<"/patients/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getPatient(id)?.name ?? "Patient" };
}

export default async function PatientPage(props: PageProps<"/patients/[id]">) {
  const doctor = await getCurrentDoctor();
  const { id } = await props.params;
  const patient = getPatient(id);
  const record = getRecord(id);
  if (!patient || !record) notFound();

  return (
    <>
      <PatientHeader patient={patient} back={{ href: "/patients", label: "Patients" }} />

      <div className="mt-6">
        <AccessGate patient={patient} nominee={getNominee(patient.id)}>
          <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-5">
              <Card highlight>
                <CardTitle icon={Sparkles}>Ekaay summary, ready before the consult</CardTitle>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {record.summary.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-body">Ekaay informs. You diagnose and prescribe.</p>
              </Card>

              <Card>
                <CardTitle icon={Pill}>Current medicines</CardTitle>
                {record.medicines.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-ink">
                    {record.medicines.map((medicine) => (
                      <li key={medicine}>{medicine}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-body">No regular medicines on file.</p>
                )}
              </Card>

              <Card>
                <CardTitle icon={ClipboardList}>Timeline</CardTitle>
                <ol className="mt-3 divide-y divide-line">
                  {record.timeline.map((entry, i) => {
                    const Icon = timelineIcons[entry.type];
                    return (
                      <li key={entry.date + entry.title}>
                        <Link
                          href={`/patients/${patient.id}/records/r${i + 1}`}
                          className="group flex items-center gap-3 py-3"
                        >
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-mid">
                            <Icon aria-hidden className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-ink group-hover:underline">
                              {entry.title}
                            </span>
                            <span className="block text-xs text-body">{entry.date}</span>
                          </span>
                          <ChevronRight aria-hidden className="size-4 text-body" />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              {record.charts.map((chart) => (
                <Card key={chart.title}>
                  <h2 className="text-sm font-bold text-ink">
                    {chart.title}, <span className="font-medium text-body">{chart.unit}</span>
                  </h2>
                  <div className="mt-3">
                    <LineChart spec={chart} />
                  </div>
                </Card>
              ))}

              <Card>
                <CardTitle icon={FlaskConical}>Latest results</CardTitle>
                <table className="mt-2 w-full text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Test</th>
                      <th scope="col">Value</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {record.results.map((result) => (
                      <tr key={result.name}>
                        <th scope="row" className="py-2.5 pr-2 text-left font-medium text-ink">
                          {result.name}
                        </th>
                        <td className="px-2 py-2.5 text-right font-bold text-ink sm:whitespace-nowrap">
                          {result.value}
                        </td>
                        <td className="w-px whitespace-nowrap py-2.5 pl-2 text-right">
                          <Chip tone={flagTone[result.flag]}>{result.label}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start xl:col-span-1 xl:flex xl:items-stretch">
              <Card>
                <CardTitle icon={MessageSquareText}>Ask the record</CardTitle>
                <p className="mt-1 text-xs text-body">Answers come from this record, with the source shown.</p>
                <AskRecord qa={record.qa} />
              </Card>

              <Card>
                <CardTitle icon={Mic}>Prescription draft, {record.draftSource}</CardTitle>
                <p className="mt-1 text-xs text-body">
                  Nothing reaches {patient.firstName} until you sign it.
                </p>
                <PrescriptionDraft
                  items={record.prescriptionDraft}
                  patientName={patient.firstName}
                  doctorName={doctor.shortName}
                  allergyTerms={getAllergyTerms(patient)}
                />
              </Card>
            </div>
          </div>
        </AccessGate>
      </div>
    </>
  );
}
