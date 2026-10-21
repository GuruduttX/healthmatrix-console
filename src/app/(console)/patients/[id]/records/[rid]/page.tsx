import { FileText, FlaskConical, MapPin, MessageSquareText, Microscope, Pill, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatientHeader } from "@/components/patient-header";
import { AccessGate } from "@/components/record/access-gate";
import { AskRecord } from "@/components/record/ask-record";
import { timelineIcons, timelineTones, timelineTypeNames } from "@/components/record/timeline-icons";
import { VaccineSchedule } from "@/components/record/vaccine-schedule";
import { EkaayHeading } from "@/components/record/patient-record-cards";
import { Card, CardTitle, Chip, flagTone, IconTile } from "@/components/ui";
import { getRecordDetail } from "@/lib/console-data";
import { ekaayReady } from "@/lib/ekaay";
import type { DetailValue, Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Record" };

const markerTone: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  brand: "bg-brand",
  neutral: "bg-muted",
};

/** Why the PDF didn't open, when the report route sends the doctor back here. */
const reportNotices: Record<string, string> = {
  "not-ready": "The lab hasn’t made the PDF yet. Try again in a little while.",
  unavailable: "Couldn’t reach the lab for the PDF just now. Try again in a moment.",
};

/** Values under the health check each was booked with, single tests last; one untitled group otherwise. */
function groupValues(values: DetailValue[]) {
  const named = [...new Set(values.flatMap((v) => (v.group ? [v.group] : [])))];
  if (!named.length) return [{ title: undefined, values }];
  const groups: { title?: string; values: DetailValue[] }[] = named.map((title) => ({
    title,
    values: values.filter((v) => v.group === title),
  }));
  const rest = values.filter((v) => !v.group);
  if (rest.length) groups.push({ title: "Other tests", values: rest });
  return groups;
}

function ValueRow({ value }: { value: DetailValue }) {
  return (
    <tr>
      <th scope="row" className="py-3 pr-3 text-left text-sm font-semibold text-ink">
        {value.name}
      </th>
      <td className="hidden px-3 py-3 sm:table-cell">
        {value.position !== undefined ? (
          <div aria-hidden className="relative h-2 rounded-full bg-selected">
            <span
              className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${markerTone[flagTone[value.flag]]}`}
              style={{ left: `${value.position * 100}%` }}
            />
          </div>
        ) : null}
        {value.range ? <p className="mt-1.5 text-xs text-muted">{value.range}</p> : null}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-display text-sm font-semibold tabular-nums text-ink">{value.value}</td>
      <td className="w-px whitespace-nowrap py-3 pl-3 text-right">
        <Chip tone={flagTone[value.flag]}>{value.label}</Chip>
      </td>
    </tr>
  );
}

export default async function RecordDetailPage(props: PageProps<"/patients/[id]/records/[rid]">) {
  const { id, rid } = await props.params;
  const { report } = await props.searchParams;
  const result = await getRecordDetail(id, rid);
  if (!result) notFound();

  const { found, entry, detail } = result;
  const { patient } = found;
  const Icon = entry ? timelineIcons[entry.type] : FileText;
  const attention = detail?.values?.filter((v) => v.flag !== "normal" && v.flag !== "pending").length ?? 0;
  const groups = detail?.values ? groupValues(detail.values) : [];
  const reportNotice = typeof report === "string" ? reportNotices[report] : undefined;
  const prescribed = Boolean(detail?.items || detail?.tests || detail?.vaccines);
  const [ContentIcon, contentTitle] = detail?.values || detail?.missing
    ? [FlaskConical, "Results"]
    : prescribed
      ? [Pill, "Prescribed"]
      : [FileText, detail?.files ? "Documents" : "Details"];

  return (
    <>
      <PatientHeader
        patient={patient}
        consult={found.todayConsult}
        back={{ href: `/patients/${patient.id}`, label: `${patient.firstName}’s record` }}
        compact
      />

      <div className="mt-5 lg:mt-6">
        <AccessGate patient={patient} nominee={found.nominee}>
          {entry && detail ? (
            // One column, full width: the entry, the notes on it side by side, what it holds, then questions.
            <div className="flex flex-col gap-5">
              <Card>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  {/* In its round of glass, tinted as its row on the patient's record. */}
                  <IconTile icon={Icon} size="lg" tone={timelineTones[entry.type]} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold leading-snug tracking-[-0.01em] text-ink">{entry.title}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-body">
                      <span>
                        {timelineTypeNames[entry.type]}, {entry.date}
                      </span>
                      <span aria-hidden className="text-muted">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="size-3.5 shrink-0 text-muted" />
                        <span className="sr-only">Where this came from:</span>
                        {detail.source}
                      </span>
                    </p>
                  </div>
                  {detail.report ? (
                    <a
                      href={`/patients/${patient.id}/records/${rid}/report`}
                      target="_blank"
                      rel="noopener"
                      title="The lab’s full PDF, with its methods and notes. Opens in a new tab."
                      className="btn btn-soft btn-sm max-sm:w-full"
                    >
                      <FileText aria-hidden className="size-4" />
                      Open PDF report
                    </a>
                  ) : null}
                </div>

                {detail.report && reportNotice ? (
                  <p role="status" className="mt-4 rounded-xl bg-surface px-3.5 py-2.5 text-[13px] text-body">
                    {reportNotice}
                  </p>
                ) : null}

                {detail.isSample ? (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] font-semibold text-warning">
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    Sample values from the lab’s test mode, not a real reading. Don’t act on them.
                  </p>
                ) : null}
              </Card>

              {detail.explains || detail.remarks ? (
                // Equal halves that stretch to the taller one; a lone note takes the full width.
                <div className={`grid gap-5 ${detail.explains && detail.remarks ? "lg:grid-cols-2" : ""}`}>
                  {detail.explains ? (
                    <Card className="flex flex-col">
                      <EkaayHeading title="Ekaay explains" />
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink">{detail.explains}</p>
                      <p className="mt-auto pt-3 text-xs text-muted">Ekaay informs. You diagnose and prescribe.</p>
                    </Card>
                  ) : null}
                  {detail.remarks ? (
                    <Card>
                      <CardTitle icon={Microscope} tile tone="neutral">
                        Pathologist’s remarks
                      </CardTitle>
                      <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-ink">{detail.remarks}</p>
                    </Card>
                  ) : null}
                </div>
              ) : null}

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle icon={ContentIcon} tile>
                    {contentTitle}
                  </CardTitle>
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
                  <table className="mt-4 w-full text-[13px]">
                    <thead className="border-b border-line text-left text-xs font-bold text-body">
                      <tr>
                        <th scope="col" className="py-2 pr-3">Test</th>
                        <th scope="col" className="hidden w-2/5 px-3 py-2 sm:table-cell">Against its range</th>
                        <th scope="col" className="px-3 py-2 text-right">Value</th>
                        <th scope="col" className="py-2 pl-3 text-right">Status</th>
                      </tr>
                    </thead>
                    {groups.map((group) => (
                      <tbody key={group.title ?? "values"} className="divide-y divide-line">
                        {group.title ? (
                          <tr>
                            <th scope="colgroup" colSpan={4} className="pb-2 pt-5 text-left text-xs font-bold text-muted">
                              {group.title}
                            </th>
                          </tr>
                        ) : null}
                        {group.values.map((value, i) => (
                          <ValueRow key={`${value.name}-${i}`} value={value} />
                        ))}
                      </tbody>
                    ))}
                  </table>
                ) : null}

                {detail.items ? (
                  <ol className="mt-4 divide-y divide-line">
                    {detail.items.map((item, i) => (
                      <li key={item} className="flex gap-3 py-2.5 text-[13px] text-ink">
                        <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {detail.tests ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-ink">Lab tests</h3>
                    <ul className="divide-y divide-line">
                      {detail.tests.map((test) => (
                        <li key={test} className="py-2.5 text-[13px] text-ink">
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {detail.vaccines ? (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-ink">Vaccines</h3>
                    <VaccineSchedule vaccines={detail.vaccines} />
                  </div>
                ) : null}

                {detail.missing ? (
                  <p className="mt-4 text-[13px] text-body">No result from the lab for {detail.missing.join(", ")}.</p>
                ) : null}

                {detail.files > 0 ? (
                  <div className="mt-5 flex flex-col items-center rounded-2xl border-[1.5px] border-dashed border-line-strong bg-surface px-6 py-10 text-center">
                    <FileText aria-hidden className="size-6 text-muted" />
                    <p className="mt-3 text-sm font-bold text-ink">
                      {detail.files === 1 ? "Original document on file" : `${detail.files} original documents on file`}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] text-body">
                      The scanned pages will show here once document storage is connected.
                    </p>
                  </div>
                ) : null}
                {!detail.values && !prescribed && !detail.missing && detail.files === 0 ? (
                  <p className="mt-4 text-[13px] text-body">
                    {detail.report ? "See the lab’s PDF report for this entry’s results." : "No values or items were recorded with this entry."}
                  </p>
                ) : null}
              </Card>

              <Card>
                <CardTitle icon={MessageSquareText} tile tone="neutral">
                  Ask the record
                </CardTitle>
                <AskRecord ready={ekaayReady()} memberId={patient.id} patientName={patient.firstName} recordId={rid} />
              </Card>
            </div>
          ) : null}
        </AccessGate>
      </div>
    </>
  );
}
