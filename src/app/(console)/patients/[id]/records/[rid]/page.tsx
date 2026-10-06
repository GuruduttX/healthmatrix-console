import { FileText, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatientHeader } from "@/components/patient-header";
import { AccessGate } from "@/components/record/access-gate";
import { timelineIcons, timelineTypeNames } from "@/components/record/timeline-icons";
import { VaccineSchedule } from "@/components/record/vaccine-schedule";
import { Card, CardTitle, Chip, flagTone } from "@/components/ui";
import { getRecordDetail } from "@/lib/console-data";
import type { Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Record" };

const markerTone: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  brand: "bg-brand",
  neutral: "bg-muted",
};

export default async function RecordDetailPage(props: PageProps<"/patients/[id]/records/[rid]">) {
  const { id, rid } = await props.params;
  const result = await getRecordDetail(id, rid);
  if (!result) notFound();

  const { found, entry, detail } = result;
  const { patient } = found;
  const Icon = entry ? timelineIcons[entry.type] : FileText;
  const attention = detail?.values?.filter((v) => v.flag !== "normal" && v.flag !== "pending").length ?? 0;

  return (
    <>
      <PatientHeader
        patient={patient}
        consult={found.todayConsult}
        back={{ href: `/patients/${patient.id}`, label: `${patient.firstName}’s record` }}
      />

      <div className="mt-6">
        <AccessGate patient={patient} nominee={found.nominee}>
          {entry && detail ? (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface text-ink-mid">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-bold text-ink">{entry.title}</h2>
                    <p className="text-sm text-body">
                      {timelineTypeNames[entry.type]}, {entry.date}
                    </p>
                  </div>
                  {detail.values ? (
                    attention > 0 ? (
                      <Chip tone="warning">
                        {attention} of {detail.values.length} need attention
                      </Chip>
                    ) : (
                      <Chip tone="success">All in range</Chip>
                    )
                ) : null}
              </div>

              {detail.values ? (
                <table className="mt-5 w-full text-sm">
                  <thead className="border-b border-line text-left text-xs font-semibold text-body">
                    <tr>
                      <th scope="col" className="py-2 pr-3">Test</th>
                      <th scope="col" className="hidden w-2/5 px-3 py-2 sm:table-cell">Against its range</th>
                      <th scope="col" className="px-3 py-2 text-right">Value</th>
                      <th scope="col" className="py-2 pl-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {detail.values.map((value) => (
                      <tr key={value.name}>
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-ink">
                          {value.name}
                        </th>
                        <td className="hidden px-3 py-3 sm:table-cell">
                          {value.position !== undefined ? (
                            <div aria-hidden className="relative h-1.5 rounded-full bg-selected">
                              <span
                                className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${markerTone[flagTone[value.flag]]}`}
                                style={{ left: `${value.position * 100}%` }}
                              />
                            </div>
                          ) : null}
                          {value.range ? <p className="mt-1.5 text-xs text-body">{value.range}</p> : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-ink">{value.value}</td>
                        <td className="w-px whitespace-nowrap py-3 pl-3 text-right">
                          <Chip tone={flagTone[value.flag]}>{value.label}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {detail.items ? (
                <ol className="mt-5 divide-y divide-line">
                  {detail.items.map((item, i) => (
                    <li key={item} className="flex gap-3 py-2.5 text-sm text-ink">
                      <span className="w-4 shrink-0 font-bold text-brand">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              ) : null}

              {detail.vaccines ? (
                <div className="mt-5 border-t border-line pt-4">
                  <h3 className="mb-3 text-sm font-bold text-ink">Vaccines</h3>
                  <VaccineSchedule vaccines={detail.vaccines} />
                </div>
              ) : null}

              {detail.files > 0 ? (
                <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
                  <FileText aria-hidden className="size-8 text-body" />
                  <p className="mt-3 font-semibold text-ink">
                    {detail.files === 1 ? "Original document on file" : `${detail.files} original documents on file`}
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-body">
                    The scanned pages will show here once document storage is connected.
                  </p>
                </div>
              ) : null}
              {!detail.values && !detail.items && !detail.vaccines && detail.files === 0 ? (
                <p className="mt-5 text-sm text-body">No values or items were recorded with this entry.</p>
              ) : null}
            </Card>

            <div className="flex min-w-0 flex-col gap-5">
              {detail.explains ? (
                <Card highlight>
                  <CardTitle icon={Sparkles}>Ekaay explains</CardTitle>
                  <p className="mt-3 text-sm leading-relaxed text-ink">{detail.explains}</p>
                  <p className="mt-4 text-xs text-body">Ekaay informs. You diagnose and prescribe.</p>
                </Card>
              ) : null}
              <Card>
                <h2 className="text-sm font-bold text-ink">Where this came from</h2>
                <p className="mt-2 text-sm leading-relaxed text-body">
                  {detail.source}
                </p>
              </Card>
            </div>
          </div>
          ) : null}
        </AccessGate>
      </div>
    </>
  );
}
