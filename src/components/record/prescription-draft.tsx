"use client";

import { CircleCheck, History, Pencil, Plus, ShieldCheck, Syringe, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDraftOwner } from "@/components/record/draft-owner";
import { VaccineDialog, type VaccineFormMemory } from "@/components/record/vaccine-dialog";
import { Chip } from "@/components/ui";
import { savePrescription } from "@/lib/console-actions";
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
  patientName: string;
  doctorName: string;
  /** Words that clash with the patient's recorded allergies. */
  allergyTerms?: string[];
  startEditing?: boolean;
}) {
  const [items, setItems] = useState(initialItems.length ? initialItems : [""]);
  const [vaccines, setVaccines] = useState(initialVaccines);
  /** The vaccine open in the dialog: an index to edit, "new" to add, null when closed. */
  const [dialog, setDialog] = useState<number | "new" | null>(null);
  const [editing, setEditing] = useState(startEditing || (initialItems.length === 0 && initialVaccines.length === 0));
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
    if (local && !sameRx(local, { items: initialItems, vaccines: initialVaccines })) {
      const id = savedId ?? local.prescriptionId;
      /* eslint-disable react-hooks/set-state-in-effect -- restoring from storage after hydration */
      setItems(local.items.length ? local.items : [""]);
      setVaccines(local.vaccines);
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
    const blank = items.every((item) => !item.trim()) && vaccines.length === 0;
    if (blank || sameRx({ items, vaccines }, { items: initialItems, vaccines: initialVaccines })) {
      removeLocalRx(owner, memberId);
    } else {
      writeLocalRx(owner, memberId, { items, vaccines, prescriptionId, saved });
    }
  }, [checked, owner, memberId, items, vaccines, prescriptionId, saved, signedId, initialItems, initialVaccines]);

  /** Drops the restored copy and goes back to what the server has. */
  function discardRestored() {
    setAskDiscard(false);
    setItems(initialItems.length ? initialItems : [""]);
    setVaccines(initialVaccines);
    setPrescriptionId(savedId);
    setSaved(Boolean(savedId));
    setRestored(null);
    if (owner) removeLocalRx(owner, memberId);
    vaccineForm?.clear();
  }

  const filled = items.map((item) => item.trim()).filter(Boolean);
  const conflict = allergyClash([...filled, ...vaccines.map((v) => [v.name, v.brand].filter(Boolean).join(" "))], allergyTerms);
  const empty = filled.length === 0 && vaccines.length === 0;

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

  function save(sign: boolean) {
    setError(undefined);
    startTransition(async () => {
      const result = await savePrescription({ prescriptionId, memberId, consultId, items: filled, vaccines, sign });
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
            <li key={i} className="flex gap-3 py-2.5 text-sm text-ink">
              <span className="w-4 shrink-0 font-bold text-brand">{i + 1}</span>
              {item}
            </li>
          ))}
        </ol>
        <VaccineList vaccines={vaccines} />
        <div className="mt-4 rounded-xl bg-success-soft p-3.5 text-sm text-success">
          <p className="flex items-center gap-2 font-bold">
            <CircleCheck aria-hidden className="size-4" />
            Signed by {doctorName}
          </p>
          <p className="mt-1 text-ink">
            It is now on {patientName}’s timeline.
            {vaccines.length > 0 ? " Each vaccine dose is in their app reminders." : ""}
          </p>
          <Link href={`/prescriptions/${signedId}`} className="mt-2 inline-block font-semibold text-ink underline">
            View or print
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {restored ? (
        <div role="status" className="mb-3 flex items-center gap-3 rounded-xl bg-brand-soft p-3 text-sm">
          <History aria-hidden className="size-4 shrink-0 text-brand" />
          <p className="min-w-0 flex-1 text-ink">
            <span className="font-bold">Picked up where you left off.</span>{" "}
            <span className="text-body">Last edited {lastEdited(restored.at)}.</span>
          </p>
          <button
            type="button"
            onClick={() => setAskDiscard(true)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-danger hover:bg-white/60"
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
          <li key={i} className="flex items-center gap-3 py-2.5 text-sm text-ink">
            <span className="w-4 shrink-0 font-bold text-brand">{i + 1}</span>
            {editing ? (
              <>
                <input
                  value={item}
                  onChange={(e) => update(items.map((it, j) => (j === i ? e.target.value : it)))}
                  aria-label={`Item ${i + 1}`}
                  placeholder="Medicine, test or advice"
                  maxLength={300}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-body focus:border-brand focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => update(items.length > 1 ? items.filter((_, j) => j !== i) : [""])}
                  className="rounded-full p-1.5 text-body hover:bg-selected"
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

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {editing ? (
          <button
            type="button"
            onClick={() => update([...items, ""])}
            className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-brand"
          >
            <Plus aria-hidden className="size-4" />
            Add an item
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDialog("new")}
          className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-brand"
        >
          <Syringe aria-hidden className="size-4" />
          Add a vaccine
        </button>
      </div>

      <VaccineList vaccines={vaccines} onEdit={(i) => setDialog(i)} onRemove={removeVaccine} />

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
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          <span className="flex items-center gap-2 font-bold">
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
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!conflict && !empty ? (
          <Chip tone="success" icon={ShieldCheck}>
            No allergy conflicts
          </Chip>
        ) : null}
        {saved && prescriptionId ? (
          <span className="text-xs text-body">Draft saved</span>
        ) : owner && checked && !empty ? (
          <span className="text-xs text-body">Kept on this device</span>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={pending || empty || saved}
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={pending || empty || Boolean(conflict)}
            className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-danger disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Sign"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-body">Nothing reaches {patientName} until you sign. Signing can’t be undone.</p>
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

/** Vaccines on the prescription; with handlers they can be edited and removed. */
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
        <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Syringe aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-ink">
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
                className="rounded-full p-2 text-body hover:bg-selected"
              >
                <Pencil aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${v.name}`}
                className="rounded-full p-2 text-body hover:bg-selected"
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
