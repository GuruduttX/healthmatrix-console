"use client";

import { CircleCheck, LockOpen, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

/** The video area of a consult. The picture is a placeholder until a video provider is chosen. */
export function ConsultStage({
  patientName,
  patientInitials,
  doctorInitials,
  status,
  recordShared,
  time,
}: {
  patientName: string;
  patientInitials: string;
  doctorInitials: string;
  status: ConsultStatus;
  recordShared: boolean;
  time: string;
}) {
  const [phase, setPhase] = useState<Phase>(initialPhase[status]);
  const [seconds, setSeconds] = useState(status === "in_progress" ? 522 : 0);
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
      aria-label="Video consult"
      className="relative flex aspect-video min-h-80 w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-ink-mid to-ink text-white"
    >
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
        {recordShared ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
            <LockOpen aria-hidden className="size-3.5" />
            {firstName}’s record shared by OTP
          </span>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">Record not shared yet</span>
        )}
        {live ? (
          <span className="rounded-full bg-black/30 px-3 py-1.5 text-sm font-bold tabular-nums" aria-label="Call time">
            {clock(seconds)}
          </span>
        ) : null}
      </div>

      <span className="inline-flex size-28 items-center justify-center rounded-full bg-brand-mid font-display text-4xl font-bold">
        {patientInitials}
      </span>
      <p className="mt-4 font-display text-2xl font-bold">{patientName}</p>
      <p className="mt-1 text-sm text-white/70">
        {live ? "Connected" : `Scheduled for ${time}. ${firstName} has not joined yet.`}
      </p>

      {live ? (
        <>
          <span className="absolute right-4 top-16 flex h-20 w-16 items-center sm:bottom-20 sm:top-auto sm:h-24 sm:w-20 justify-center rounded-xl border border-white/40 bg-ink-mid">
            {cameraOn ? (
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-success text-xs font-bold">
                {doctorInitials}
              </span>
            ) : (
              <VideoOff aria-hidden className="size-5 text-white/70" />
            )}
          </span>
          <div className="absolute bottom-4 flex items-center gap-3">
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
              onClick={() => setPhase("ended")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold hover:bg-danger"
            >
              <PhoneOff aria-hidden className="size-5" />
              End consult
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPhase("live")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold hover:bg-danger"
        >
          <Video aria-hidden className="size-5" />
          Start consult
        </button>
      )}
    </section>
  );
}
