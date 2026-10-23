import { FolderOpen, KeyRound, LockKeyhole, ScrollText, ShieldAlert } from "lucide-react";

import { useSequence } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Avatar, Flag, tile } from "./parts";

const code = "381902";
// Locked → request pressed → OTP sent → six digits arrive → the record opens.
const beats = [1300, 600, 900, 260, 260, 260, 260, 260, 700, 3800];
const OPEN = beats.length - 1;

const sections = ["Summary", "Medicines", "Vaccines", "Timeline", "Lab tests", "Trends"];

export function AccessMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const digits = Math.max(0, Math.min(6, step - 2));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className={`${tile} flex items-center gap-3 px-4 py-3`}>
        <Avatar initials="AR" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Ananya Rao</p>
          <p className="text-xs font-medium text-body max-sm:hidden">Allergies and alerts only, until she shares</p>
        </div>
        {step === OPEN ? (
          <Flag tone="success" className={m.pop}>
            <FolderOpen className="size-3" /> Open · 24 h
          </Flag>
        ) : (
          <Flag>
            <LockKeyhole className="size-3" /> {step >= 2 ? "Awaiting OTP" : "No access"}
          </Flag>
        )}
      </div>

      {step < 2 ? (
        <div className={`${tile} grid flex-1 place-items-center px-4 py-6 text-center`}>
          <div>
            <span className="brand-tile mx-auto size-12">
              <KeyRound className="size-5" />
            </span>
            <p className="mt-3 text-sm font-bold">Her full history opens with her OTP</p>
            <span className={`${step === 1 ? m.press : m.beckon} mt-4 inline-flex h-9 items-center rounded-full bg-[#d03f01] px-4 text-xs font-bold text-white`}>
              Request access with an OTP
            </span>
          </div>
        </div>
      ) : step < OPEN ? (
        <div className={`${tile} ${m.rise} grid flex-1 place-items-center px-4 py-6 text-center`}>
          <div>
            <p className="text-sm font-bold">Code sent to Ananya</p>
            <p className="mt-1 text-xs font-medium text-body">It works for 10 minutes</p>
            <div className="mt-4 flex justify-center gap-1.5 sm:gap-2">
              {code.split("").map((digit, index) => (
                <span
                  key={index}
                  className={`grid h-11 w-9 place-items-center rounded-xl font-display text-lg font-bold transition-colors sm:w-10 ${
                    index < digits ? "bg-white text-ink ring-2 ring-brand-light" : index === digits ? "bg-white/60 ring-2 ring-brand" : "bg-white/60 ring-1 ring-line"
                  }`}
                >
                  {index < digits ? <span className={m.pop}>{digit}</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {sections.map((section, index) => (
              <span
                key={section}
                className={`${m.pop} rounded-full px-3 py-1 text-xs font-bold ${index === 0 ? "bg-ink text-white" : "bg-white/75 text-body ring-1 ring-line"}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {section}
              </span>
            ))}
          </div>
          <div className={`${tile} ${m.rise} flex-1 space-y-2.5 px-4 py-3`} style={{ animationDelay: "200ms" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Summary</p>
            <p className="text-sm font-semibold">Type 2 diabetes since 2021 · on Metformin 500 mg</p>
            <Flag tone="danger">
              <ShieldAlert className="size-3" /> Allergic to penicillin
            </Flag>
            <p className="text-sm font-medium text-body">Last HbA1c 7.4%, up from 6.8% in March.</p>
          </div>
          <p className={`${m.rise} flex items-center gap-2 text-xs font-semibold text-body`} style={{ animationDelay: "400ms" }}>
            <ScrollText className="size-3.5 text-success" /> Logged · opened by you, OTP shared by Ananya
          </p>
        </div>
      )}
    </div>
  );
}
