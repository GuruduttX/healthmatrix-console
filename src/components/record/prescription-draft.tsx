"use client";

import { CircleCheck, Pencil, Plus, ShieldCheck, Syringe, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { VaccineDialog } from "@/components/record/vaccine-dialog";
import { Chip } from "@/components/ui";
import { savePrescription } from "@/lib/console-actions";
import { allergyClash } from "@/lib/patient-text";
import { describeDose, describeSchedule, formatDay, type VaccineInput } from "@/lib/vaccines";

/**
 * A prescription being written: edit the lines, save the draft, then sign. Signing sends it
 * to the patient's timeline and can't be undone.
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

  const filled = items.map((item) => item.trim()).filter(Boolean);
  const conflict = allergyClash([...filled, ...vaccines.map((v) => [v.name, v.brand].filter(Boolean).join(" "))], allergyTerms);
  const empty = filled.length === 0 && vaccines.length === 0;

  function update(next: string[]) {
    setItems(next);
    setSaved(false);
  }

  function saveVaccine(vaccine: VaccineInput) {
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
      setPrescriptionId(result.id);
      setSaved(true);
      setEditing(false);
      if (result.signed) setSignedId(result.id);
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
        {saved && prescriptionId ? <span className="text-xs text-body">Draft saved</span> : null}
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
