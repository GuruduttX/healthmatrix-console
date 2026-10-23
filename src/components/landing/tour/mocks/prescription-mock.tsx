import { Check, FlaskConical, Pill, ShieldAlert, ShieldCheck } from "lucide-react";

import { useSequence } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Flag, tile } from "./parts";

// First line → a second → it clashes → swapped → a test added → Sign pressed → signed.
const beats = [900, 1000, 1700, 1200, 1000, 650, 3600];
const SIGNED = beats.length - 1;

function Line({ icon: Icon, name, detail, className = "" }: { icon: typeof Pill; name: string; detail: string; className?: string }) {
  return (
    <div className={`${tile} flex items-center gap-3 px-3.5 py-2.5 ${className}`}>
      <span className="brand-tile size-8">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[0.8125rem] font-bold">{name}</p>
        <p className="truncate text-xs font-medium text-body">{detail}</p>
      </div>
    </div>
  );
}

export function PrescriptionMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const clash = step === 2;

  return (
    <div className="relative flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">For Ananya Rao</p>
        {step < 2 ? (
          <Flag>Allergy check</Flag>
        ) : clash ? (
          <Flag tone="danger" className={m.pop}>
            <ShieldAlert className="size-3" /> 1 clash
          </Flag>
        ) : (
          <Flag tone="success" className={m.pop}>
            <ShieldCheck className="size-3" /> No clashes
          </Flag>
        )}
      </div>

      <Line icon={Pill} name="Metformin 500 mg" detail="Twice a day, after meals · 3 months" className={m.rise} />

      {step >= 1 ? (
        clash ? (
          <div className={`${m.shake} rounded-2xl border border-danger/30 bg-danger-soft px-3.5 py-2.5`}>
            <p className="text-[0.8125rem] font-bold text-danger">Amoxicillin 500 mg</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-danger">
              <ShieldAlert className="size-3.5" /> Clashes with her penicillin allergy
            </p>
          </div>
        ) : step === 1 ? (
          <Line icon={Pill} name="Amoxicillin 500 mg" detail="Three times a day · 5 days" className={m.rise} />
        ) : (
          <Line key="swapped" icon={Pill} name="Azithromycin 500 mg" detail="Once a day · 3 days" className={m.pop} />
        )
      ) : null}

      {step >= 4 ? <Line icon={FlaskConical} name="HbA1c" detail="Lab test · booked at a pod near her" className={m.rise} /> : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Check className="size-3.5 text-success" /> Draft saved
        </p>
        <span
          className={`inline-flex h-9 items-center rounded-full px-5 text-xs font-bold transition-colors ${
            clash ? "bg-selected text-muted" : "bg-[#d03f01] text-white"
          } ${step === 5 ? m.press : step === 4 ? m.beckon : ""}`}
        >
          {step === SIGNED ? "Signed" : "Review and sign"}
        </span>
      </div>

      {step === SIGNED ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className={`${m.stamp} rounded-2xl border-[3px] border-success bg-white/85 px-5 py-3 text-center text-success shadow-lg`}>
            <p className="font-display text-lg font-bold uppercase tracking-wider">Signed digitally</p>
            <p className="text-[0.6875rem] font-bold">Dr. Meera Iyer · Reg. DMC 48217</p>
            <p className="text-[0.625rem] font-semibold opacity-80">Telemedicine Practice Guidelines, 2020</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
