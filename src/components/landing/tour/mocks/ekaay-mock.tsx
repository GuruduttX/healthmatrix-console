import { Sparkles } from "lucide-react";

import { useSequence, useTyped } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Flag, tile } from "./parts";

const questions = ["Summarise their history", "Which results are out of range?", "How have their readings changed?", "Any clashes with their allergies or medicines?"];
const asked = questions[1];
const answer = "Two results are out of range: HbA1c and LDL cholesterol. HbA1c has risen across her last three tests.";

// Suggestions → one picked → reading → the answer typing → the results under it.
const beats = [1100, 900, 1300, 3600, 3600];

export function EkaayMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const typed = useTyped(answer, play && step >= 3, { speed: 26 });

  return (
    <div className="flex h-full flex-col gap-3">
      {step < 2 ? (
        <>
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="brand-tile size-8">
              <Sparkles className="size-4" />
            </span>
            Ask the record
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {questions.map((question, index) => (
              <span
                key={question}
                className={`${m.rise} rounded-2xl px-3.5 py-2.5 text-[0.8125rem] font-semibold transition-all duration-300 ${
                  step === 1 && question === asked ? "scale-[1.03] bg-white text-brand-deep ring-2 ring-brand" : "bg-white/70 text-ink-mid ring-1 ring-line"
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {question}
              </span>
            ))}
          </div>
          <div className={`${tile} mt-auto px-4 py-3 text-[0.8125rem] font-medium text-muted`}>Ask anything about Ananya’s record…</div>
        </>
      ) : (
        <>
          <p className={`${m.slide} ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[0.8125rem] font-semibold text-white`}>{asked}</p>
          <div className={`${tile} ${m.rise} flex gap-2.5 px-3.5 py-3`}>
            <span className="brand-tile size-7">
              <Sparkles className="size-3.5" />
            </span>
            <p className="min-h-10 flex-1 text-[0.8125rem] font-medium leading-relaxed">
              {step === 2 ? (
                <span className={`${m.dots} pt-2`} aria-label="Reading the record">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <>
                  {typed}
                  {typed.length < answer.length ? <span aria-hidden className={m.caret} /> : null}
                </>
              )}
            </p>
          </div>
          {step === 4 ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-2">
                {[
                  ["HbA1c", "7.4%", "range under 5.7"],
                  ["LDL cholesterol", "162 mg/dL", "range under 100"],
                ].map(([name, value, range], index) => (
                  <div key={name} className={`${tile} ${m.rise} flex items-center justify-between gap-2 px-3.5 py-2`} style={{ animationDelay: `${index * 120}ms` }}>
                    <div className="min-w-0">
                      <p className="truncate text-[0.8125rem] font-bold">{name}</p>
                      <p className="text-[0.6875rem] font-medium text-muted">{range}</p>
                    </div>
                    <Flag tone="danger">{value}</Flag>
                  </div>
                ))}
              </div>
              <div className={`${tile} ${m.rise} hidden w-36 flex-col px-3 py-2 sm:flex`} style={{ animationDelay: "240ms" }}>
                <p className="text-[0.6875rem] font-bold text-muted">HbA1c, last 3</p>
                <svg viewBox="0 0 120 50" className="mt-1 flex-1" aria-hidden>
                  <line x1="0" x2="120" y1="34" y2="34" stroke="var(--color-success)" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
                  <path d="M6 32 L60 22 L114 10" fill="none" stroke="var(--color-danger)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className={m.draw} />
                  {[
                    [6, 32],
                    [60, 22],
                    [114, 10],
                  ].map(([x, y], index) => (
                    <circle key={x} cx={x} cy={y} r="3.5" fill="#fff" stroke="var(--color-danger)" strokeWidth="2" className={m.pop} style={{ animationDelay: `${300 + index * 350}ms`, transformBox: "fill-box", transformOrigin: "center" }} />
                  ))}
                </svg>
              </div>
            </div>
          ) : null}
          <p className="mt-auto text-[0.6875rem] font-semibold text-muted">Ekaay can be wrong. It informs; you diagnose and prescribe.</p>
        </>
      )}
    </div>
  );
}
