"use client";

import { Camera, History, Keyboard, Mic, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { useDraftOwner } from "@/components/record/draft-owner";
import { PrescriptionDraft } from "@/components/record/prescription-draft";
import { Card, IconTile } from "@/components/ui";
import { listLocalRx, readLocalRx, readVaccineForm } from "@/lib/rx-autosave";

type PatientOption = {
  id: string;
  name: string;
  firstName: string;
  allergies: string[];
  allergyTerms: string[];
  medicines: string[];
};

/** One way to capture: a tile of glass set into the card. */
const captureButton =
  "pressable glass-flat flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-[13px] font-bold text-ink enabled:hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-45";

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
  const [typing, setTyping] = useState(false);
  const owner = useDraftOwner();
  /** Patients with a prescription in progress in this browser, newest first. */
  const [inProgress, setInProgress] = useState<{ id: string; name: string; lines: number }[]>([]);

  const patient = options.find((o) => o.id === patientId);
  const hasLocal = (id: string) =>
    Boolean(owner && id && (readLocalRx(owner, id) || readVaccineForm(owner, id)));

  function loadInProgress() {
    if (!owner) return;
    const names = new Map(options.map((o) => [o.id, o.name]));
    setInProgress(
      listLocalRx(owner)
        // Only patients whose record is still open can be prescribed for.
        .filter(({ memberId }) => names.has(memberId))
        .map(({ memberId, rx }) => ({
          id: memberId,
          name: names.get(memberId)!,
          lines: rx.items.filter((item) => item.trim()).length + rx.vaccines.length + (rx.tests?.length ?? 0),
        })),
    );
  }

  // After a refresh: list what was being written, and reopen it for the patient in the URL.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reading localStorage after hydration */
    loadInProgress();
    if (patientId && hasLocal(patientId)) setTyping(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on opening
  }, [owner]);

  function choosePatient(id: string) {
    // The patient being left may have just gained a prescription in progress.
    loadInProgress();
    setPatientId(id);
    // Straight back into a prescription already in progress for them.
    setTyping(hasLocal(id));
    // Kept in the address so a refresh comes back to the same patient.
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("patient", id);
    else url.searchParams.delete("patient");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-6">
      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <label htmlFor="rx-patient" className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
            <Step n={1} />
            Patient
          </label>
          <select
            id="rx-patient"
            value={patientId}
            onChange={(e) => choosePatient(e.target.value)}
            className="field mt-3"
          >
            <option value="">Choose a patient</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {inProgress.some((p) => p.id !== patientId) ? (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <History aria-hidden className="size-3.5" />
                In progress on this device
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {inProgress
                  .filter((p) => p.id !== patientId)
                  .map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => choosePatient(p.id)}
                        className="chip"
                      >
                        {p.name}
                        <span className="font-normal text-body">
                          {" "}
                          · {p.lines} {p.lines === 1 ? "item" : "items"}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            {options.length > 0
              ? "Only patients whose record is open are listed. Ask for an OTP to add others."
              : "No patient’s record is open to you right now. Open a patient’s page and ask for an OTP first."}
          </p>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
            <Step n={2} />
            Capture
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <button type="button" disabled className={captureButton}>
              <Mic aria-hidden className="size-5 text-muted" />
              Dictate
            </button>
            <button type="button" disabled className={captureButton}>
              <Camera aria-hidden className="size-5 text-muted" />
              Photo of a note
            </button>
            <button type="button" disabled={!patient} onClick={() => setTyping(true)} className={captureButton}>
              <Keyboard aria-hidden className="size-5 text-ink-mid" />
              Type it
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Dictation and photos need Ekaay, which isn’t connected yet. Type the prescription for now.
          </p>
        </Card>

        {patient && typing ? (
          <Card>
            <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
              <Step n={3} />
              Review and sign
            </h2>
            <p className="mt-1 text-xs text-muted">Prescription for {patient.name}.</p>
            <PrescriptionDraft
              key={patient.id}
              memberId={patient.id}
              items={[]}
              startEditing
              patientName={patient.firstName}
              doctorName={doctorName}
              allergyTerms={patient.allergyTerms}
            />
          </Card>
        ) : null}
      </div>

      <aside className="glass-panel rounded-2xl p-4 sm:p-5 xl:sticky xl:top-20">
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-ink">
          <IconTile icon={ShieldCheck} tone="success" />
          Safety checks
        </h2>
        {patient ? (
          <dl className="mt-3 flex flex-col gap-4 text-[13px]">
            <div>
              <dt className="text-xs font-bold text-muted">Allergies on record</dt>
              <dd className="mt-1 text-ink">
                {patient.allergies.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 font-bold text-danger">
                    <TriangleAlert aria-hidden className="size-4" />
                    {patient.allergies.join(", ")}
                  </span>
                ) : (
                  "None recorded"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted">Current medicines</dt>
              <dd className="mt-1 text-ink">
                {patient.medicines.length > 0 ? patient.medicines.join("; ") : "No regular medicines"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-[13px] text-body">Choose a patient to see their allergies and medicines.</p>
        )}
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          Every draft is checked against these before you can sign. A clash blocks the Sign button.
        </p>
      </aside>
    </div>
  );
}

/** The number of a step in writing a prescription. */
function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold tabular-nums text-white">
      {n}
    </span>
  );
}
