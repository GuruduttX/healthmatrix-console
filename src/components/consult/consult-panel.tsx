"use client";

import { useState } from "react";

import { AskRecord } from "@/components/record/ask-record";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import type { PatientRecord } from "@/lib/types";

const tabs = ["Summary", "Ask the record", "Prescription"] as const;

/** The record beside the video: Ekaay's summary, questions and the prescription draft. */
export function ConsultPanel({
  record,
  patientName,
  doctorName,
  allergyTerms,
}: {
  record: PatientRecord;
  patientName: string;
  doctorName: string;
  allergyTerms: string[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div role="tablist" aria-label="Record" className="flex gap-1 rounded-full bg-surface p-1">
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${
              tab === name ? "bg-ink text-white" : "text-body hover:text-ink"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* All three stay mounted so a half-written draft or question survives a tab change. */}
      <div role="tabpanel" hidden={tab !== "Summary"}>
        <ul className="mt-5 flex flex-col gap-2.5">
          {record.summary.map((line) => (
            <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              {line}
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-xs font-bold text-body">Current medicines</h3>
        <p className="mt-1 text-sm text-ink">
          {record.medicines.length > 0 ? record.medicines.join("; ") : "No regular medicines on file."}
        </p>
        <p className="mt-4 text-xs text-body">Ekaay informs. You diagnose and prescribe.</p>
      </div>
      <div role="tabpanel" hidden={tab !== "Ask the record"}>
        <AskRecord qa={record.qa} />
      </div>
      <div role="tabpanel" hidden={tab !== "Prescription"}>
        <PrescriptionDraft
          items={record.prescriptionDraft}
          patientName={patientName}
          doctorName={doctorName}
          allergyTerms={allergyTerms}
        />
      </div>
    </section>
  );
}
