"use client";

import { CircleCheck, LockOpen, Maximize2, Mic, MicOff, Minimize2, PhoneOff, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { endConsult, startConsult } from "@/lib/console-actions";
import type { ConsultStatus } from "@/lib/types";

type Phase = "lobby" | "live" | "ended";

const initialPhase: Record<ConsultStatus, Phase> = {
  scheduled: "lobby",
  in_progress: "live",
  completed: "ended",
};

function clock(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const secondsSince = (iso?: string) => (iso ? Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000)) : 0);

/**
 * The video area of a consult. Starting and ending are saved to the consult; the picture is a
 * placeholder until Twilio Video is connected. It can fill the screen and shrink back.
 */
export function ConsultStage({
  consultId,
  startedAt,
  patientName,
  patientInitials,
  doctorInitials,
  status,
  recordShared,
  time,
}: {
  consultId: string;
  /** ISO time the call started, while it is in progress. */
  startedAt?: string;
  patientName: string;
  patientInitials: string;
  doctorInitials: string;
  status: ConsultStatus;
  recordShared: boolean;
  time: string;
}) {
  const [phase, setPhase] = useState<Phase>(initialPhase[status]);
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt));
  const [pending, startTransition] = useTransition();
  const stageRef = useRef<HTMLElement>(null);
  /** Filling the screen. Browser full screen where allowed, else a fixed overlay (iPhone Safari). */
  const [expanded, setExpanded] = useState(false);

  function expand() {
    setExpanded(true);
    stageRef.current?.requestFullscreen?.().catch(() => {});
  }

  function shrink() {
    setExpanded(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  // Leaving browser full screen (Esc, a swipe) or pressing Esc on the overlay shrinks it too, and
  // the page behind stops scrolling while it fills the screen.
  useEffect(() => {
    if (!expanded) return;
    const onFullscreen = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  function start() {
    startTransition(async () => {
      await startConsult(consultId);
      setSeconds(0);
      setPhase("live");
    });
  }

  function end() {
    startTransition(async () => {
      await endConsult(consultId);
      shrink();
      setPhase("ended");
    });
  }
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const firstName = patientName.split(" ")[0];

  if (phase === "ended") {
    return (
      <section className="rounded-3xl border border-line bg-card p-8 text-center shadow-card">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CircleCheck aria-hidden className="size-7" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">Consult ended</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">
          {seconds > 0 ? `You spoke with ${firstName} for ${clock(seconds)}. ` : ""}
          Sign the prescription so medicines and follow-ups reach {firstName}’s reminders. Tests you
          order are booked at a pod near them, and results come back to you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/prescriptions" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-danger">
            Go to prescriptions
          </Link>
          <Link href="/" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink hover:bg-selected">
            Back to Today
          </Link>
        </div>
      </section>
    );
  }

  const live = phase === "live";

  return (
    <section
      ref={stageRef}
      aria-label="Video consult"
      className={`flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ink-mid to-ink text-white ${
        expanded ? "fixed inset-0 z-50 h-dvh w-full" : "relative aspect-video min-h-80 w-full rounded-3xl"
      }`}
    >
      <div
        className={`absolute inset-x-4 flex items-center justify-between gap-3 ${expanded ? "top-[calc(1rem+env(safe-area-inset-top))]" : "top-4"}`}
      >
        {recordShared ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
            <LockOpen aria-hidden className="size-3.5" />
            {firstName}’s record shared by OTP
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">Record not shared yet</span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {live ? (
            <span className="rounded-full bg-black/30 px-3 py-1.5 text-sm font-bold tabular-nums" aria-label="Call time">
              {clock(seconds)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={expanded ? shrink : expand}
            aria-label={expanded ? "Exit full screen" : "Full screen"}
            title={expanded ? "Exit full screen" : "Full screen"}
            className="inline-flex size-9 items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          >
            {expanded ? <Minimize2 aria-hidden className="size-4" /> : <Maximize2 aria-hidden className="size-4" />}
          </button>
        </div>
      </div>

      <span className="inline-flex size-28 items-center justify-center rounded-full bg-brand-mid font-display text-4xl font-bold">
        {patientInitials}
      </span>
      <p className="mt-4 font-display text-2xl font-bold">{patientName}</p>
      <p className="mt-1 text-sm text-white/70">
        {live ? "In consult. Video calling isn’t connected yet." : `Scheduled for ${time}. ${firstName} has not joined yet.`}
      </p>

      {live ? (
        <>
          <span
            className={`absolute right-4 flex h-20 w-16 items-center justify-center rounded-xl border border-white/40 bg-ink-mid sm:top-auto ${
              expanded
                ? "top-[calc(4rem+env(safe-area-inset-top))] sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:h-36 sm:w-28"
                : "top-16 sm:bottom-20 sm:h-24 sm:w-20"
            }`}
          >
            {cameraOn ? (
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-success text-xs font-bold">
                {doctorInitials}
              </span>
            ) : (
              <VideoOff aria-hidden className="size-5 text-white/70" />
            )}
          </span>
          <div className={`absolute flex items-center gap-3 ${expanded ? "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]" : "bottom-4"}`}>
            <button
              type="button"
              aria-pressed={!micOn}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              onClick={() => setMicOn((on) => !on)}
              className={`inline-flex size-12 items-center justify-center rounded-full ${micOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-ink"}`}
            >
              {micOn ? <Mic aria-hidden className="size-5" /> : <MicOff aria-hidden className="size-5" />}
            </button>
            <button
              type="button"
              aria-pressed={!cameraOn}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              onClick={() => setCameraOn((on) => !on)}
              className={`inline-flex size-12 items-center justify-center rounded-full ${cameraOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-ink"}`}
            >
              {cameraOn ? <Video aria-hidden className="size-5" /> : <VideoOff aria-hidden className="size-5" />}
            </button>
            <button
              type="button"
              onClick={end}
              disabled={pending}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold hover:bg-danger disabled:opacity-60"
            >
              <PhoneOff aria-hidden className="size-5" />
              End consult
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold hover:bg-danger disabled:opacity-60"
        >
          <Video aria-hidden className="size-5" />
          Start consult
        </button>
      )}
    </section>
  );
}
