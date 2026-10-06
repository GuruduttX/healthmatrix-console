import { Syringe } from "lucide-react";

import { Chip } from "@/components/ui";
import type { DoseStatus, Tone, VaccineView } from "@/lib/types";

const doseMeta: Record<DoseStatus, { tone: Tone; label: (dueOn: string, givenOn?: string) => string }> = {
  given: { tone: "success", label: (_, givenOn) => (givenOn ? `Given ${givenOn}` : "Given") },
  due: { tone: "neutral", label: (dueOn) => `Due ${dueOn}` },
  overdue: { tone: "danger", label: (dueOn) => `Overdue, was due ${dueOn}` },
  cancelled: { tone: "neutral", label: () => "Cancelled" },
};

/**
 * Prescribed vaccines with each dose's state. "Given" comes from the patient marking the dose's
 * reminder as taken in their app.
 */
export function VaccineSchedule({ vaccines }: { vaccines: VaccineView[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {vaccines.map((v) => (
        <li key={v.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand print:hidden">
            <Syringe aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-ink">
              {v.name}
              {v.brand ? <span className="font-medium text-body"> ({v.brand})</span> : null}
            </p>
            <p className="text-body">
              {v.doseText}. {v.scheduleText}.
            </p>
            {v.instructions ? <p className="mt-0.5 text-ink">{v.instructions}</p> : null}
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {v.doses.map((dose) => {
                const meta = doseMeta[dose.status];
                return (
                  <li key={dose.number}>
                    <Chip tone={meta.tone}>
                      {dose.total > 1 ? `Dose ${dose.number}: ` : ""}
                      {meta.label(dose.dueOn, dose.givenOn)}
                    </Chip>
                  </li>
                );
              })}
            </ol>
          </div>
        </li>
      ))}
    </ul>
  );
}
