import { ChevronRight, ClipboardList, Info, Pill, Sparkles, Syringe } from "lucide-react";
import Link from "next/link";

import { LineChart } from "@/components/line-chart";
import { EkaaySummary } from "@/components/record/ekaay-summary";
import { LabBookingsCard } from "@/components/record/lab-bookings-card";
import { timelineIcons, timelineTones } from "@/components/record/timeline-icons";
import { VaccineSchedule } from "@/components/record/vaccine-schedule";
import { Card, IconTile, PanelHeader } from "@/components/ui";
import type { PatientRecord, PatientRef, VaccineView } from "@/lib/types";

/** Room above a card when a jump link scrolls to it, for the bar and the jump pills on phones. */
const anchor = "scroll-mt-[calc(env(safe-area-inset-top)+7.5rem)] lg:scroll-mt-24";

/** "Ekaay summary" with Ekaay's round orange mark, as in the app, and the reminder that it is not a diagnosis. */
export function EkaayHeading({ title = "Ekaay summary" }: { title?: string }) {
  return (
    <div className="flex items-center gap-2">
      <IconTile icon={Sparkles} size="xs" look="solid" />
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
        <Info aria-hidden className="size-3.5" />
        Not a diagnosis
      </span>
    </div>
  );
}

/**
 * A patient's record as cards: Ekaay's summary, medicines, vaccines and the timeline of past
 * prescriptions, then pod lab tests and trend charts. Lab results show only on the lab tests card. Two grid columns; the page around it places them. Shared by the patient
 * page and the consult page, which shows it under the call.
 */
export function PatientRecordCards({
  patient,
  record,
  vaccines,
  summary = true,
}: {
  patient: PatientRef;
  record: PatientRecord;
  vaccines: VaccineView[];
  /** Leave out Ekaay's summary where the page already shows it. */
  summary?: boolean;
}) {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-5">
        {summary ? (
          <Card id="summary" className={anchor}>
            <EkaayHeading />
            <EkaaySummary
              memberId={patient.id}
              patientName={patient.firstName}
              lines={record.summary}
            />
            <p className="mt-3.5 text-xs text-muted">
              Ekaay informs. You diagnose and prescribe.
            </p>
          </Card>
        ) : null}

        <Card flush id="medicines" className={anchor}>
          <PanelHeader
            icon={Pill}
            tone="success"
            title="Current medicines"
            count={record.medicines.length}
          />
          {record.medicines.length > 0 ? (
            <ul className="divide-y divide-line text-sm text-ink">
              {record.medicines.map((medicine) => (
                <li
                  key={medicine}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-success"
                  />
                  {medicine}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3.5 text-[13px] text-body sm:px-5">
              No regular medicines on file.
            </p>
          )}
        </Card>

        {vaccines.length > 0 ? (
          <Card flush id="vaccines" className={anchor}>
            <PanelHeader
              icon={Syringe}
              title="Vaccines you prescribed"
              count={vaccines.length}
            />
            <div className="px-4 py-4 sm:px-5">
              <VaccineSchedule vaccines={vaccines} />
            </div>
          </Card>
        ) : null}

        <Card flush id="timeline" className={anchor}>
          <PanelHeader
            icon={ClipboardList}
            tone="neutral"
            title="Prescriptions"
            count={record.timeline.length}
          />
          {record.timeline.length === 0 ? (
            <p className="px-4 py-3.5 text-[13px] text-body sm:px-5">
              No prescriptions for {patient.firstName} yet.
            </p>
          ) : null}
          <ol className="divide-y divide-line empty:hidden">
            {record.timeline.map((entry) => {
              const Icon = timelineIcons[entry.type];
              return (
                <li key={entry.id}>
                  <Link
                    href={`/patients/${patient.id}/records/${entry.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/60 active:bg-white/60 sm:px-5"
                  >
                    <IconTile
                      icon={Icon}
                      tone={timelineTones[entry.type]}
                      size="md"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {entry.title}
                      </span>
                      {entry.preview ? (
                        <span className="block truncate text-[13px] text-body">
                          {entry.preview}
                        </span>
                      ) : null}
                      <span className="block text-xs tabular-nums text-muted">
                        {entry.date}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="size-4.5 text-muted transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        {record.labBookings.length > 0 ? (
          <LabBookingsCard
            patientId={patient.id}
            bookings={record.labBookings}
            connected={record.labConnected}
            className={anchor}
          />
        ) : null}

        {record.charts.map((chart, i) => (
          <Card
            key={chart.title}
            id={i === 0 ? "trends" : undefined}
            className={anchor}
          >
            <h2 className="font-display text-base font-semibold text-ink">
              {chart.title}{" "}
              <span className="font-sans text-[13px] font-medium text-muted">
                {chart.unit}
              </span>
            </h2>
            <div className="mt-3">
              <LineChart spec={chart} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
