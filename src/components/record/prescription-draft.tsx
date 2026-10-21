"use client";

import { CircleCheck, FlaskConical, History, Pencil, Plus, ShieldCheck, Syringe, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDraftOwner } from "@/components/record/draft-owner";
import { LabTestDialog } from "@/components/record/lab-test-dialog";
import { VaccineDialog, type VaccineFormMemory } from "@/components/record/vaccine-dialog";
import { Chip, IconTile } from "@/components/ui";
import { savePrescription } from "@/lib/console-actions";
import type { LabTestInput } from "@/lib/lab-tests";
import { allergyClash } from "@/lib/patient-text";
import {
  readLocalRx,
  readVaccineForm,
  removeLocalRx,
  removeVaccineForm,
  sameRx,
  writeLocalRx,
  writeVaccineForm,
  type LocalRx,
} from "@/lib/rx-autosave";
import { describeDose, describeSchedule, formatDay, type VaccineInput } from "@/lib/vaccines";

/**
 * A prescription being written: edit the lines, save the draft, then sign. Signing sends it
 * to the patient's timeline and can't be undone.
 *
 * Every change is also kept in this browser for the patient (see `rx-autosave.ts`), so a
 * refresh brings back what was being written, saved as a draft or not.
 */
export function PrescriptionDraft({
  prescriptionId: savedId,
  memberId,
  consultId,
  items: initialItems,
  vaccines: initialVaccines = [],
  tests: initialTests = [],
  patientName,
  doctorName,
  allergyTerms = [],
  startEditing = false,
}: {
  prescriptionId?: string;
  memberId: string;
  consultId?: string;
  items: string[];
  vaccines?: VaccineInput[];
  /** Lab tests from Mobilab's catalog. */
  tests?: LabTestInput[];
  patientName: string;
  doctorName: string;
  /** Words that clash with the patient's recorded allergies. */
  allergyTerms?: string[];
  startEditing?: boolean;
}) {
  const [items, setItems] = useState(initialItems.length ? initialItems : [""]);
  const [vaccines, setVaccines] = useState(initialVaccines);
  const [tests, setTests] = useState(initialTests);
  /** The vaccine open in the dialog: an index to edit, "new" to add, null when closed. */
  const [dialog, setDialog] = useState<number | "new" | null>(null);
  const [choosingTests, setChoosingTests] = useState(false);
  const [editing, setEditing] = useState(
    startEditing || (initialItems.length === 0 && initialVaccines.length === 0 && initialTests.length === 0),
  );
  const [prescriptionId, setPrescriptionId] = useState(savedId);
  const [signedId, setSignedId] = useState<string>();
  const [saved, setSaved] = useState(Boolean(savedId));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const owner = useDraftOwner();
  /** The browser's copy that was brought back on opening, for the notice. */
  const [restored, setRestored] = useState<LocalRx | null>(null);
  /** Autosave waits until the browser's copy has been read, so it can't overwrite it first. */
  const [checked, setChecked] = useState(false);
  const [askDiscard, setAskDiscard] = useState(false);

  // On opening: bring back what was being written for this patient, unless the page already
  // shows the same thing. Runs after hydration because the server can't see localStorage.
  useEffect(() => {
    const local = owner ? readLocalRx(owner, memberId) : null;
    if (local && !sameRx(local, { items: initialItems, vaccines: initialVaccines, tests: initialTests })) {
      const id = savedId ?? local.prescriptionId;
      /* eslint-disable react-hooks/set-state-in-effect -- restoring from storage after hydration */
      setItems(local.items.length ? local.items : [""]);
      setVaccines(local.vaccines);
      setTests(local.tests ?? []);
      setPrescriptionId(id);
      setSaved(local.saved && Boolean(id));
      setEditing(true);
      setRestored(local);
    }
    setChecked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Once per patient: later prop changes are the server catching up with this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, memberId]);

  // Keep the browser's copy in step. Nothing to keep when it is blank or matches what the
  // server sent; once signed, it is gone for good.
  useEffect(() => {
    if (!checked || !owner || signedId) return;
    const blank = items.every((item) => !item.trim()) && vaccines.length === 0 && tests.length === 0;
    if (blank || sameRx({ items, vaccines, tests }, { items: initialItems, vaccines: initialVaccines, tests: initialTests })) {
      removeLocalRx(owner, memberId);
    } else {
      writeLocalRx(owner, memberId, { items, vaccines, tests, prescriptionId, saved });
    }
  }, [checked, owner, memberId, items, vaccines, tests, prescriptionId, saved, signedId, initialItems, initialVaccines, initialTests]);

  /** Drops the restored copy and goes back to what the server has. */
  function discardRestored() {
    setAskDiscard(false);
    setItems(initialItems.length ? initialItems : [""]);
    setVaccines(initialVaccines);
    setTests(initialTests);
    setPrescriptionId(savedId);
    setSaved(Boolean(savedId));
    setRestored(null);
    if (owner) removeLocalRx(owner, memberId);
    vaccineForm?.clear();
  }

  const filled = items.map((item) => item.trim()).filter(Boolean);
  const conflict = allergyClash([...filled, ...vaccines.map((v) => [v.name, v.brand].filter(Boolean).join(" "))], allergyTerms);
  const empty = filled.length === 0 && vaccines.length === 0 && tests.length === 0;

  function update(next: string[]) {
    setItems(next);
    setSaved(false);
  }

  /** Keeps a half-filled "Add a vaccine" form for this patient between openings. */
  const vaccineForm: VaccineFormMemory | undefined = owner
    ? {
        load: () => readVaccineForm(owner, memberId),
        save: (form) => writeVaccineForm(owner, memberId, form),
        clear: () => removeVaccineForm(owner, memberId),
      }
    : undefined;

  function saveVaccine(vaccine: VaccineInput) {
    // Added: the form it came from is done with.
    if (dialog === "new") vaccineForm?.clear();
    setVaccines((list) => (dialog === "new" ? [...list, vaccine] : list.map((v, i) => (i === dialog ? vaccine : v))));
    setDialog(null);
    setSaved(false);
  }

  function removeVaccine(index: number) {
    setVaccines((list) => list.filter((_, i) => i !== index));
    setSaved(false);
  }

  function saveTests(next: LabTestInput[]) {
    setTests(next);
    setChoosingTests(false);
    setSaved(false);
  }

  function removeTest(index: number) {
    setTests((list) => list.filter((_, i) => i !== index));
    setSaved(false);
  }

  function save(sign: boolean) {
    setError(undefined);
    startTransition(async () => {
      const result = await savePrescription({ prescriptionId, memberId, consultId, items: filled, vaccines, tests, sign });
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems(filled);
      setRestored(null);
      setPrescriptionId(result.id);
      setSaved(true);
      setEditing(false);
      if (result.signed) {
        setSignedId(result.id);
        if (owner) removeLocalRx(owner, memberId);
        vaccineForm?.clear();
      }
    });
  }

  if (signedId) {
    return (
      <div className="mt-4">
        <ol className="divide-y divide-line">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 py-2.5 text-[13px] text-ink">
              <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">{i + 1}</span>
              {item}
            </li>
          ))}
        </ol>
        <TestList tests={tests} />
        <VaccineList vaccines={vaccines} />
        <div className="mt-4 rounded-2xl bg-success-soft p-4 text-[13px] text-ink">
          <p className="flex items-center gap-2 font-semibold">
            <CircleCheck aria-hidden className="size-4 text-success" />
            Signed by {doctorName}
          </p>
          <p className="mt-1 text-ink">
            It is now on {patientName}’s timeline.
            {vaccines.length > 0 ? " Each vaccine dose is in their app reminders." : ""}
          </p>
          <Link href={`/prescriptions/${signedId}`} className="btn btn-secondary btn-sm mt-3">
            View or print
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {restored ? (
        <div role="status" className="glass-flat mb-3 flex items-center gap-3 rounded-2xl py-2 pl-3.5 pr-1.5 text-[13px]">
          <History aria-hidden className="size-4 shrink-0 text-muted" />
          <p className="min-w-0 flex-1 text-ink">
            <span className="font-semibold">Picked up where you left off.</span>{" "}
            <span className="text-body">Last edited {lastEdited(restored.at)}.</span>
          </p>
          <button
            type="button"
            onClick={() => setAskDiscard(true)}
            className="btn btn-danger-ghost btn-sm shrink-0"
          >
            Discard
          </button>
        </div>
      ) : null}
      {askDiscard ? (
        <ConfirmDialog
          title="Discard this prescription?"
          confirmLabel="Discard"
          onConfirm={discardRestored}
          onCancel={() => setAskDiscard(false)}
        >
          What you wrote for {patientName} on this device will be deleted
          {savedId ? ", and the prescription goes back to the draft saved earlier" : ""}. This can’t be undone.
        </ConfirmDialog>
      ) : null}
      <ol className="divide-y divide-line">
        {/* Blank lines only matter while editing; a vaccine-only draft shows no empty line. */}
        {(editing ? items : filled).map((item, i) => (
          <li key={i} className="flex items-center gap-3 py-2 text-[13px] text-ink">
            <span className="w-4 shrink-0 font-semibold tabular-nums text-muted">{i + 1}</span>
            {editing ? (
              <>
                <input
                  value={item}
                  onChange={(e) => update(items.map((it, j) => (j === i ? e.target.value : it)))}
                  aria-label={`Item ${i + 1}`}
                  placeholder="Medicine, test or advice"
                  maxLength={300}
                  className="field min-w-0 flex-1"
                />
                <button
                  type="button"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => update(items.length > 1 ? items.filter((_, j) => j !== i) : [""])}
                  className="btn btn-ghost btn-sm btn-icon text-muted"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-2 flex flex-wrap gap-1">
        {editing ? (
          <button
            type="button"
            onClick={() => update([...items, ""])}
            className="btn btn-ghost btn-sm -ml-2.5 text-ink"
          >
            <Plus aria-hidden className="size-4 text-muted" />
            Add an item
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setChoosingTests(true)}
          className="btn btn-ghost btn-sm text-ink"
        >
          <FlaskConical aria-hidden className="size-4 text-muted" />
          {tests.length ? "Edit tests" : "Add tests"}
        </button>
        <button
          type="button"
          onClick={() => setDialog("new")}
          className="btn btn-ghost btn-sm text-ink"
        >
          <Syringe aria-hidden className="size-4 text-muted" />
          Add a vaccine
        </button>
      </div>

      <TestList tests={tests} onRemove={removeTest} />
      <VaccineList vaccines={vaccines} onEdit={(i) => setDialog(i)} onRemove={removeVaccine} />

      {choosingTests ? (
        <LabTestDialog selected={tests} onSave={saveTests} onClose={() => setChoosingTests(false)} />
      ) : null}

      {dialog !== null ? (
        <VaccineDialog
          key={String(dialog)}
          open
          vaccine={dialog === "new" ? undefined : vaccines[dialog]}
          onSave={saveVaccine}
          onClose={() => setDialog(null)}
          memory={dialog === "new" ? vaccineForm : undefined}
        />
      ) : null}

      {conflict ? (
        <p role="alert" className="mt-3 rounded-2xl bg-danger-soft p-3.5 text-[13px] text-danger">
          <span className="flex items-center gap-2 font-semibold">
            <TriangleAlert aria-hidden className="size-4 shrink-0" />
            Allergy conflict
          </span>
          <span className="mt-1 block text-ink">
            “{conflict}” clashes with an allergy on {patientName}’s record. Change or remove it before
            signing.
          </span>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {!conflict && !empty ? (
          <Chip tone="success" icon={ShieldCheck}>
            No allergy conflicts
          </Chip>
        ) : null}
        {saved && prescriptionId ? (
          <span className="text-xs text-muted">Draft saved</span>
        ) : owner && checked && !empty ? (
          <span className="text-xs text-muted">Kept on this device</span>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing((e) => !e)} className="btn btn-ghost">
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={pending || empty || saved}
            className="btn btn-secondary"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={pending || empty || Boolean(conflict)}
            className="btn btn-primary px-5"
          >
            {pending ? "Saving…" : "Sign"}
          </button>
        </div>
      </div>
      <p className="mt-2.5 text-xs text-muted">Nothing reaches {patientName} until you sign. Signing can’t be undone.</p>
    </div>
  );
}

/** "4:32 pm today", "yesterday, 6:10 pm" or "3 Oct, 9:05 am". */
function lastEdited(at: number) {
  const when = new Date(at);
  const time = when.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return `${time} today`;
  if (days === 1) return `yesterday, ${time}`;
  return `${when.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

/** Lab tests on the prescription, as one panel of glass set into the card; with `onRemove` each can be taken off. */
function TestList({ tests, onRemove }: { tests: LabTestInput[]; onRemove?: (index: number) => void }) {
  if (tests.length === 0) return null;
  return (
    <section className="glass-flat mt-3 rounded-2xl p-3.5">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <IconTile icon={FlaskConical} size="xs" />
        Lab tests
      </h3>
      <ul className="mt-2 divide-y divide-line">
        {tests.map((test, i) => (
          <li key={`${test.kind}-${test.code}`} className="flex items-start gap-3 py-2 text-[13px]">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{test.name}</p>
              <p className="text-xs text-body">
                {test.kind === "profile" ? `Health check, ${test.tests.length} tests` : "Single test"}
              </p>
            </div>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${test.name}`}
                className="btn btn-ghost btn-sm btn-icon -my-1 text-muted"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Vaccines on the prescription, each a panel of glass set into the card; with handlers they can be edited and removed. */
function VaccineList({
  vaccines,
  onEdit,
  onRemove,
}: {
  vaccines: VaccineInput[];
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
}) {
  if (vaccines.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {vaccines.map((v, i) => (
        <li key={i} className="glass-flat flex items-start gap-3 rounded-2xl p-3.5">
          <IconTile icon={Syringe} size="md" className="mt-0.5" />
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-semibold text-ink">
              {v.name}
              {v.brand ? <span className="font-medium text-body"> ({v.brand})</span> : null}
            </p>
            <p className="text-body">{describeDose(v)}</p>
            <p className="text-body">
              {describeSchedule(v)}: {v.dates.map(formatDay).join(", ")}
            </p>
            {v.instructions ? <p className="mt-1 text-ink">{v.instructions}</p> : null}
          </div>
          {onEdit && onRemove ? (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEdit(i)}
                aria-label={`Edit ${v.name}`}
                className="btn btn-ghost btn-sm btn-icon text-muted"
              >
                <Pencil aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${v.name}`}
                className="btn btn-ghost btn-sm btn-icon text-muted"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
