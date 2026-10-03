"use client";

import { Camera, Keyboard, Mic, Square, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";

import { PrescriptionDraft } from "@/components/record/prescription-draft";

type PatientOption = {
  id: string;
  name: string;
  firstName: string;
  allergies: string[];
  allergyTerms: string[];
  medicines: string[];
  sampleDraft: string[];
};

type Source = "voice" | "photo" | "typed";

const sourceNames: Record<Source, string> = {
  voice: "from your voice note",
  photo: "from the photo of your note",
  typed: "typed",
};

const captureButton =
  "flex flex-1 flex-col items-center gap-2 rounded-2xl border border-line bg-card px-4 py-5 text-sm font-bold text-ink hover:border-brand-light hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50";

export function PrescriptionComposer({
  options,
  initialPatientId,
  doctorName,
}: {
  options: PatientOption[];
  initialPatientId?: string;
  doctorName: string;
}) {
  const [patientId, setPatientId] = useState(
    options.some((o) => o.id === initialPatientId) ? initialPatientId! : "",
  );
  const [recording, setRecording] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const patient = options.find((o) => o.id === patientId);

  function choosePatient(id: string) {
    setPatientId(id);
    setSource(null);
    setRecording(false);
  }

  function toggleRecording() {
    if (recording) setSource("voice");
    setRecording((r) => !r);
  }

  return (
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <label htmlFor="rx-patient" className="text-sm font-bold text-ink">
            1. Patient
          </label>
          <select
            id="rx-patient"
            value={patientId}
            onChange={(e) => choosePatient(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink focus:border-brand focus:outline-none"
          >
            <option value="">Choose a patient</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-body">
            Only patients whose record is open are listed. Ask for an OTP to add others.
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 className="text-sm font-bold text-ink">2. Capture</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={!patient} onClick={toggleRecording} className={captureButton}>
              {recording ? (
                <Square aria-hidden className="size-6 fill-brand text-brand" />
              ) : (
                <Mic aria-hidden className="size-6 text-brand" />
              )}
              {recording ? "Stop and draft" : "Dictate"}
            </button>
            <button
              type="button"
              disabled={!patient || recording}
              onClick={() => fileInput.current?.click()}
              className={captureButton}
            >
              <Camera aria-hidden className="size-6 text-brand" />
              Photo of a note
            </button>
            <button
              type="button"
              disabled={!patient || recording}
              onClick={() => setSource("typed")}
              className={captureButton}
            >
              <Keyboard aria-hidden className="size-6 text-brand" />
              Type it
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-label="Photo of a handwritten note"
              onChange={(e) => {
                if (e.target.files?.length) setSource("photo");
                e.target.value = "";
              }}
            />
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-body">
            {recording
              ? "Listening. Say the medicines, tests and advice, then stop."
              : "Until Ekaay is connected, dictation and photos fill in an example draft."}
          </p>
        </section>

        {patient && source ? (
          <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
            <h2 className="text-sm font-bold text-ink">3. Review and sign</h2>
            <p className="mt-1 text-xs text-body">
              Draft for {patient.name}, {sourceNames[source]}. Nothing reaches {patient.firstName} until you sign it.
            </p>
            <PrescriptionDraft
              key={`${patient.id}-${source}`}
              items={source === "typed" ? [""] : patient.sampleDraft}
              startEditing={source === "typed"}
              patientName={patient.firstName}
              doctorName={doctorName}
              allergyTerms={patient.allergyTerms}
            />
          </section>
        ) : null}
      </div>

      <aside className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">Safety checks</h2>
        {patient ? (
          <dl className="mt-3 flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-semibold text-body">Allergies on record</dt>
              <dd className="mt-1 text-ink">
                {patient.allergies.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-danger">
                    <TriangleAlert aria-hidden className="size-4" />
                    {patient.allergies.join(", ")}
                  </span>
                ) : (
                  "None recorded"
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-body">Current medicines</dt>
              <dd className="mt-1 text-ink">
                {patient.medicines.length > 0 ? patient.medicines.join("; ") : "No regular medicines"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-body">Choose a patient to see their allergies and medicines.</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-body">
          Every draft is checked against these before you can sign. A clash blocks the Sign button.
        </p>
      </aside>
    </div>
  );
}
