import { Check, FlaskConical } from "lucide-react";

import { useSequence } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Avatar, Flag, tile } from "./parts";

// The list → a result arrives → Mark reviewed pressed → reviewed.
const beats = [1000, 2400, 650, 3400];
const REVIEWED = beats.length - 1;

const filters = ["New results", "Booked", "Not booked yet", "Reviewed"];

const earlier = [
  { initials: "RM", name: "Rohan Mehta", test: "Lipid profile", when: "Back 2 h ago", flag: { tone: "warning", label: "Borderline" } },
  { initials: "FK", name: "Farah Khan", test: "Complete blood count", when: "Back yesterday", flag: { tone: "success", label: "In range" } },
] as const;

export function ResultsMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const reviewed = step === REVIEWED;

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-white/60 p-1 ring-1 ring-line">
        {filters.map((filter, index) => (
          <span key={filter} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${index === 0 ? "bg-white text-ink shadow-sm" : "text-body"}`}>
            {filter}
            {index === 0 ? <span className="ml-1.5 text-brand-deep">{step >= 1 && !reviewed ? 3 : 2}</span> : null}
          </span>
        ))}
      </div>

      {step >= 1 ? (
        <div className={`${tile} ${m.drop} relative flex items-center gap-3 px-3.5 py-3 transition-opacity duration-500 ${reviewed ? "opacity-70" : "ring-2 ring-brand-light"}`}>
          <Avatar initials="AR" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[0.8125rem] font-bold">
              HbA1c
              {reviewed ? null : <Flag tone="brand">New</Flag>}
            </p>
            <p className="truncate text-xs font-medium text-body">Ananya Rao · Back just now</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Flag tone="danger">7.4% · Out of range</Flag>
            {reviewed ? (
              <Flag tone="success" className={m.pop}>
                <Check className="size-3" /> Reviewed
              </Flag>
            ) : (
              <span className={`${step === 2 ? m.press : ""} inline-flex h-7 items-center rounded-full bg-ink px-3 text-[0.6875rem] font-bold text-white`}>Mark reviewed</span>
            )}
          </div>
        </div>
      ) : null}

      {earlier.map(({ initials, name, test, when, flag }) => (
        <div key={name} className={`${tile} flex items-center gap-3 px-3.5 py-3`}>
          <Avatar initials={initials} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-bold">{test}</p>
            <p className="truncate text-xs font-medium text-body">
              {name} · {when}
            </p>
          </div>
          <Flag tone={flag.tone}>{flag.label}</Flag>
        </div>
      ))}

      <p className="mt-auto flex items-center gap-2 text-xs font-semibold text-muted">
        <FlaskConical className="size-3.5 text-brand-deep" /> Including the tests you order, booked at a pod near the patient
      </p>
    </div>
  );
}
