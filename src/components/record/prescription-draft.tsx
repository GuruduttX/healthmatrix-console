"use client";

import { CircleCheck, Plus, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useState } from "react";

import { Chip } from "@/components/ui";

export function PrescriptionDraft({
  items: initialItems,
  patientName,
  doctorName,
  allergyTerms = [],
  startEditing = false,
}: {
  items: string[];
  patientName: string;
  doctorName: string;
  /** Words that clash with the patient's recorded allergies. */
  allergyTerms?: string[];
  startEditing?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState(startEditing);
  const [signed, setSigned] = useState(false);

  const filled = items.filter((item) => item.trim());
  const conflicts = filled.filter((item) =>
    allergyTerms.some((term) => item.toLowerCase().includes(term)),
  );

  function update(index: number, value: string) {
    setItems((list) => list.map((item, i) => (i === index ? value : item)));
  }

  function sign() {
    setItems(filled);
    setEditing(false);
    setSigned(true);
  }

  return (
    <div className="mt-4">
      <ol className="divide-y divide-line">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 text-sm text-ink">
            <span className="w-4 shrink-0 font-bold text-brand">{i + 1}</span>
            {editing ? (
              <>
                <input
                  value={item}
                  onChange={(e) => update(i, e.target.value)}
                  aria-label={`Item ${i + 1}`}
                  placeholder="Medicine, test or advice"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-body focus:border-brand focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
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

      {editing ? (
        <button
          type="button"
          onClick={() => setItems((list) => [...list, ""])}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
        >
          <Plus aria-hidden className="size-4" />
          Add an item
        </button>
      ) : null}

      {conflicts.length > 0 && !signed ? (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          <span className="flex items-center gap-2 font-bold">
            <TriangleAlert aria-hidden className="size-4 shrink-0" />
            Allergy conflict
          </span>
          <span className="mt-1 block text-ink">
            “{conflicts[0]}” clashes with an allergy on {patientName}’s record. Change or remove it
            before signing.
          </span>
        </p>
      ) : null}

      {signed ? (
        <div className="mt-4 rounded-xl bg-success-soft p-3.5 text-sm text-success">
          <p className="flex items-center gap-2 font-bold">
            <CircleCheck aria-hidden className="size-4" />
            Signed by {doctorName}
          </p>
          <p className="mt-1 text-ink">
            Sent to {patientName}’s app. Tests and follow-ups are now in their reminders.
          </p>
          <button
            type="button"
            onClick={() => setSigned(false)}
            className="mt-2 font-semibold text-ink underline"
          >
            Reopen the draft
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {conflicts.length === 0 ? (
            <Chip tone="success" icon={ShieldCheck}>
              No allergy conflicts
            </Chip>
          ) : null}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected"
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              type="button"
              onClick={sign}
              disabled={filled.length === 0 || conflicts.length > 0}
              className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
