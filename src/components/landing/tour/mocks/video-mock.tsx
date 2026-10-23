import { useEffect, useState } from "react";
import { FilePen, Maximize2, Mic, PhoneOff, ShieldAlert, Video } from "lucide-react";

import { useSequence } from "../../hooks/use-sequence";
import m from "./mocks.module.css";
import { Avatar, Flag, tile } from "./parts";

// In the waiting room → Admit pressed → connecting → on the call.
const beats = [2600, 600, 1000, 5200];
const CALL = beats.length - 1;

/** The call's clock, ticking while the call is on screen and playing. */
function useCallClock(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => {
      window.clearInterval(timer);
      setSeconds(0);
    };
  }, [running]);
  const total = 252 + seconds;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function VideoMock({ play }: { play: boolean }) {
  const step = useSequence(beats, play);
  const clock = useCallClock(play && step === CALL);

  return (
    <div className="flex h-full gap-3">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-ink-deep text-white">
        {step < CALL ? (
          <div className="grid flex-1 place-items-center bg-teal px-4 text-center">
            <div>
              <span className="relative mx-auto grid size-20 place-items-center text-[#f6af91]">
                {step === 2 ? null : (
                  <>
                    <span className={m.ripple} />
                    <span className={m.ripple} />
                    <span className={m.ripple} />
                  </>
                )}
                <Avatar initials="AR" size="lg" />
              </span>
              <p key={step === 2 ? "joining" : "waiting"} className={`${m.rise} mt-5 text-sm font-bold`}>
                {step === 2 ? "Connecting…" : "Ananya is in the waiting room"}
              </p>
              <p className="mt-1 text-xs font-medium text-white/70">{step === 2 ? "Opening a private room for two" : "Waiting 2 min"}</p>
              {step === 2 ? (
                <span className={`${m.spin} mx-auto mt-5 block size-7 rounded-full border-2 border-white/25 border-t-white`} />
              ) : (
                <span className={`${step === 1 ? m.press : m.beckon} mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-[#d03f01] px-5 text-xs font-bold`}>
                  <Video className="size-4" /> Admit Ananya
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={`${m.feed} ${m.rise} relative flex-1`}>
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid size-24 place-items-center rounded-full bg-white/15 font-display text-3xl font-bold text-white/90 backdrop-blur-sm">AR</span>
            </div>
            <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold">
              <span className="size-2 animate-pulse rounded-full bg-live" />
              {clock}
            </span>
            <span className="absolute bottom-16 left-3 inline-flex items-center gap-2 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold">
              Ananya Rao
              <span className={m.bars}>
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className={`${m.pop} absolute right-3 top-3 grid h-20 w-14 place-items-center rounded-xl border border-white/30 bg-[#2a4f55] text-[0.625rem] font-bold sm:h-24 sm:w-18`} style={{ animationDelay: "300ms" }}>
              You
            </span>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {[Mic, Video, Maximize2].map((Icon, index) => (
                <span key={index} className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Icon className="size-4" />
                </span>
              ))}
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-danger px-3.5 text-xs font-bold">
                <PhoneOff className="size-4" /> End consult
              </span>
            </div>
          </div>
        )}
      </div>

      <aside className="hidden w-40 shrink-0 flex-col gap-2 sm:flex">
        <div className={`${tile} px-3 py-2.5`}>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">Current medicines</p>
          <p className="mt-1 text-xs font-semibold">Metformin 500 mg</p>
          <p className="text-xs font-semibold">Vitamin D3, weekly</p>
        </div>
        <div className={`${tile} px-3 py-2.5`}>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">Allergies</p>
          <Flag tone="danger" className="mt-1">
            <ShieldAlert className="size-3" /> Penicillin
          </Flag>
        </div>
        <div className={`${tile} px-3 py-2.5`}>
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">Last HbA1c</p>
          <p className="mt-1 text-xs font-semibold text-danger">7.4% · out of range</p>
        </div>
        <span className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/80 text-xs font-bold text-ink ring-1 ring-line">
          <FilePen className="size-3.5" /> Prescription
        </span>
      </aside>
    </div>
  );
}
