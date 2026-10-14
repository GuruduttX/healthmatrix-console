"use client";

import { useEffect, useRef, useState } from "react";

import { AskRecord } from "@/components/record/ask-record";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import type { PatientRecord } from "@/lib/types";

const tabs = ["Summary", "Ask the record", "Prescription"] as const;
type Tab = (typeof tabs)[number];

/** A link to `#prescription` anywhere on the page opens the Prescription tab and scrolls to it. */
export const PRESCRIPTION_HASH = "#prescription";

/**
 * The record beside the video: Ekaay's summary, questions and the prescription draft. Once the
 * consult is over it opens on the prescription, the one thing left to do.
 */
export function ConsultPanel({
  record,
  memberId,
  consultId,
  patientName,
  doctorName,
  allergyTerms,
  initialTab = "Summary",
}: {
  record: PatientRecord;
  memberId: string;
  consultId: string;
  patientName: string;
  doctorName: string;
  allergyTerms: string[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    function openPrescription() {
      if (window.location.hash !== PRESCRIPTION_HASH) return;
      setTab("Prescription");
      panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Ready to type: the first empty line, once the tab is showing.
      requestAnimationFrame(() => {
        const lines = panel.current?.querySelectorAll<HTMLInputElement>("[role=tabpanel]:not([hidden]) input");
        [...(lines ?? [])].find((line) => !line.value)?.focus({ preventScroll: true });
      });
      // So the same link works again later.
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    openPrescription();
    window.addEventListener("hashchange", openPrescription);
    return () => window.removeEventListener("hashchange", openPrescription);
  }, []);

  return (
    <section
      ref={panel}
      id="prescription"
      className="scroll-mt-[calc(env(safe-area-inset-top)+4.5rem)] rounded-xl border border-line bg-card p-4 shadow-card sm:p-5 lg:scroll-mt-20"
    >
      <div role="tablist" aria-label="Record" className="segmented">
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className="segment px-2 text-[13px] sm:px-3"
          >
            {name}
          </button>
        ))}
      </div>

      {/* All three stay mounted so a half-written draft survives a tab change. */}
      <div role="tabpanel" hidden={tab !== "Summary"}>
        {record.summary.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2.5">
            {record.summary.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] text-body">
            Ekaay hasn’t written a summary for this patient yet. The timeline and results are on their
            record page.
          </p>
        )}
        <h3 className="mt-5 border-t border-line pt-4 text-xs font-bold text-muted">Current medicines</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          {record.medicines.length > 0 ? record.medicines.join("; ") : "No regular medicines on file."}
        </p>
        <p className="mt-4 text-xs text-muted">Ekaay informs. You diagnose and prescribe.</p>
      </div>
      <div role="tabpanel" hidden={tab !== "Ask the record"}>
        <AskRecord />
      </div>
      <div role="tabpanel" hidden={tab !== "Prescription"}>
        <PrescriptionDraft
          prescriptionId={record.draft?.id}
          memberId={memberId}
          consultId={consultId}
          items={record.draft?.items ?? []}
          vaccines={record.draft?.vaccines}
          tests={record.draft?.tests}
          patientName={patientName}
          doctorName={doctorName}
          allergyTerms={allergyTerms}
        />
      </div>
    </section>
  );
}
