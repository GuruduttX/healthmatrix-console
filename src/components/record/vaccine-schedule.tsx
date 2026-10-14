import { Syringe } from "lucide-react";

import { Chip, IconTile } from "@/components/ui";
import type { DoseStatus, Tone, VaccineView } from "@/lib/types";

const doseMeta: Record<DoseStatus, { tone: Tone; label: (dueOn: string, givenOn?: string) => string }> = {
  given: { tone: "success", label: (_, givenOn) => (givenOn ? `Given ${givenOn}` : "Given") },
  due: { tone: "brand", label: (dueOn) => `Due ${dueOn}` },
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
          <IconTile icon={Syringe} size="md" className="mt-0.5 print:hidden" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-ink">
              {v.name}
              {v.brand ? <span className="font-normal text-body"> ({v.brand})</span> : null}
            </p>
            <p className="mt-0.5 text-[13px] text-body">
              {v.doseText}. {v.scheduleText}.
            </p>
            {v.instructions ? <p className="mt-0.5 text-[13px] text-ink">{v.instructions}</p> : null}
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {v.doses.map((dose) => {
                const meta = doseMeta[dose.status];
                return (
                  <li key={dose.number}>
                    <Chip tone={meta.tone}>
                      <span className={`tabular-nums ${dose.status === "cancelled" ? "text-muted" : ""}`}>
                        {dose.total > 1 ? `Dose ${dose.number}: ` : ""}
                        {meta.label(dose.dueOn, dose.givenOn)}
                      </span>
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
