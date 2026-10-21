"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { AskRecord } from "@/components/record/ask-record";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import type { PatientRecord } from "@/lib/types";

const tabs = ["Summary", "Ask the record", "Prescription"] as const;
type Tab = (typeof tabs)[number];

/** A link to `#prescription` anywhere on the page opens the Prescription tab and scrolls to it. */
export const PRESCRIPTION_HASH = "#prescription";

/**
 * The record beside the video, on a pane of glass: Ekaay's summary, questions and the
 * prescription draft. Once the consult is over it opens on the prescription, the one thing left to do.
 */
export function ConsultPanel({
  record,
  summary,
  memberId,
  consultId,
  patientName,
  doctorName,
  allergyTerms,
  askReady,
  initialTab = "Summary",
}: {
  record: PatientRecord;
  /** Ekaay's summary (`EkaaySummary`), rendered on the server: it may be written as the page loads. */
  summary: ReactNode;
  memberId: string;
  consultId: string;
  patientName: string;
  doctorName: string;
  allergyTerms: string[];
  /** Whether Ekaay can answer questions (`ekaayReady()`). */
  askReady: boolean;
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
      className="glass-panel scroll-mt-[calc(env(safe-area-inset-top)+4.5rem)] rounded-2xl p-4 sm:p-5 lg:scroll-mt-20"
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
        {summary}
        <h3 className="mt-5 border-t border-line pt-4 text-xs font-bold text-muted">Current medicines</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          {record.medicines.length > 0 ? record.medicines.join("; ") : "No regular medicines on file."}
        </p>
        <p className="mt-4 text-xs text-muted">Ekaay informs. You diagnose and prescribe.</p>
      </div>
      <div role="tabpanel" hidden={tab !== "Ask the record"}>
        <AskRecord ready={askReady} memberId={memberId} patientName={patientName} />
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
