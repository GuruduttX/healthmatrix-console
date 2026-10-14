import { ArrowRight, BellRing, KeyRound, LockOpen, TriangleAlert, UserCheck, Video } from "lucide-react";
import Link from "next/link";

import { RelativeTime } from "@/components/relative-time";
import { Avatar } from "@/components/ui";
import { ageAndSex } from "@/lib/patient-text";
import type { Consult } from "@/lib/types";

/** The app lets a member join until 30 minutes after their slot ends. */
const JOIN_AFTER_END_MS = 30 * 60 * 1000;

type State = "live" | "waiting" | "next";

/**
 * The call in progress, else a patient in the waiting room, else the next booking still joinable.
 * `then`: the booking after a call or a waiting patient, so it isn't forgotten meanwhile.
 */
function pick(consults: Consult[], now = Date.now()) {
  const joinable = consults.filter((c) => c.status === "scheduled" && Date.parse(c.endsAt) + JOIN_AFTER_END_MS > now);
  const live = consults.find((c) => c.status === "in_progress");
  const waiting = joinable.find((c) => c.patientWaiting);
  const consult = live ?? waiting ?? joinable[0];
  if (!consult) return null;
  const state: State = live ? "live" : waiting ? "waiting" : "next";
  return {
    consult,
    state,
    overdue: state === "next" && Date.parse(consult.startsAt) < now,
    then: state === "next" ? undefined : joinable.find((c) => c !== consult && Date.parse(c.startsAt) > now),
  };
}

/** A pill on the teal card. */
const pill = "glass inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

/** The pulsing green dot of something happening now. */
function LiveDot() {
  return (
    <span aria-hidden className="relative inline-flex size-2 shrink-0">
      <span className="absolute inset-0 rounded-full bg-live/60 motion-safe:animate-ping" />
      <span className="relative size-2 rounded-full bg-live shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
    </span>
  );
}

/**
 * The one consult that needs the doctor next, at the top of Today, on the teal card the app
 * uses for a member's next consult: the call in progress, else a patient in the waiting room,
 * else the next booking. It says whether the record is open yet, so there's time to ask for the
 * OTP before the call. `soon`: ids of consults about to start, when the doctor has that alert on.
 */
export function UpNext({ consults, soon }: { consults: Consult[]; soon: string[] }) {
  const picked = pick(consults);
  if (!picked) return null;

  const { consult, state, overdue, then } = picked;
  const { patient } = consult;
  const about = ageAndSex(patient);
  const firstName = patient.firstName;
  const urgent = state !== "next" || overdue || soon.includes(consult.id);
  const recordOpen = patient.access.status === "active";

  const eyebrow = {
    live: "In consult now",
    waiting: "In the waiting room",
    next: overdue ? "Running late" : "Up next",
  }[state];

  /** The countdown panel: a quiet line over the big one. */
  const panel =
    state === "live"
      ? { label: "Started", value: <RelativeTime at={consult.startedAt ?? consult.startsAt} /> }
      : state === "waiting"
        ? { label: `Booked for ${consult.time}`, value: "Waiting for you" }
        : overdue
          ? { label: `Due at ${consult.time}. ${firstName} hasn’t joined yet`, value: <RelativeTime at={consult.startsAt} /> }
          : { label: "Starts", value: <RelativeTime at={consult.startsAt} /> };

  const action = {
    live: { label: "Return to the call", icon: Video },
    waiting: { label: `Admit ${firstName}`, icon: UserCheck },
    next: { label: "Open consult", icon: ArrowRight },
  }[state];

  return (
    <section
      aria-labelledby="up-next-title"
      className="teal-bg relative overflow-hidden rounded-3xl p-4 text-white shadow-[0_14px_30px_rgba(16,128,109,0.28)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`${pill} ${urgent && state === "next" ? "border-brand-light/40 bg-brand/35" : ""}`}>
          {state === "next" ? (
            urgent ? (
              <BellRing aria-hidden className="size-3.5" />
            ) : (
              <Video aria-hidden className="size-3.5" />
            )
          ) : (
            <LiveDot />
          )}
          {eyebrow}
        </span>
        <span className={`${pill} tabular-nums`}>
          <span className="truncate">
            {consult.day} · {consult.time}
          </span>
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="relative shrink-0 rounded-full bg-white/12 p-0.5 ring-[1.5px] ring-white/50">
              <Avatar initials={patient.initials} tone={patient.avatarTone} size="md" />
              <span className="absolute -bottom-1 -right-1 inline-flex size-5.5 items-center justify-center rounded-full border-2 border-teal bg-brand">
                <Video aria-hidden className="size-2.5" strokeWidth={2.8} />
              </span>
            </span>
            <div className="min-w-0">
              <h2 id="up-next-title" className="truncate font-display text-[19px] font-bold leading-6 tracking-[-0.01em]">
                <Link href={`/patients/${patient.id}`} className="hover:underline">
                  {patient.name}
                </Link>
              </h2>
              {about ? <p className="truncate text-xs text-white/70">{about}</p> : null}
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/85">{consult.reason}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className={pill}>
              {recordOpen ? (
                <LockOpen aria-hidden className="size-3.5 text-live" />
              ) : (
                <KeyRound aria-hidden className="size-3.5 text-brand-light" />
              )}
              {recordOpen ? "Record open" : patient.access.status === "pending" ? "Awaiting OTP" : "Record not shared yet"}
            </span>
            {patient.allergies.map((allergy) => (
              <span key={allergy} className="inline-flex items-center gap-1.5 rounded-full border border-[#ffb48f]/35 bg-danger/40 px-2.5 py-1 text-xs font-semibold text-[#ffe1d3]">
                <TriangleAlert aria-hidden className="size-3.5" />
                Allergy: {allergy}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:w-72 sm:shrink-0">
          <div className="glass flex items-center gap-3 rounded-2xl bg-white/10 py-2.5 pl-3.5 pr-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white/70">{panel.label}</p>
              <p className="truncate font-display text-[22px] font-bold leading-7 tabular-nums">{panel.value}</p>
            </div>
            <Link
              // Admit here lets the patient in: the consult page admits on arrival, no second click.
              href={`/consults/${consult.id}${state === "waiting" ? "?admit=1" : ""}`}
              aria-label={action.label}
              className="btn btn-primary btn-sm shrink-0 px-4 shadow-[0_8px_20px_rgba(221,67,1,0.45)]"
            >
              <action.icon aria-hidden className="size-4" />
              {state === "live" ? "Join" : state === "waiting" ? "Admit" : "Open"}
            </Link>
          </div>
          {/* Asking now means the record is there when the call starts. */}
          {!recordOpen && state !== "live" ? (
            <Link href={`/patients/${patient.id}`} className="btn btn-glass btn-sm">
              <KeyRound aria-hidden className="size-4" />
              {patient.access.status === "pending" ? "Enter the OTP" : "Ask for the record"}
            </Link>
          ) : null}
        </div>
      </div>

      {then ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/12 pt-3 text-[13px] text-white/75">
          <span>
            After this{" "}
            <Link href={`/consults/${then.id}`} className="font-bold text-white hover:underline">
              {then.patient.name}
            </Link>{" "}
            at {then.time}, <RelativeTime at={then.startsAt} />
          </span>
          {soon.includes(then.id) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
              <BellRing aria-hidden className="size-3" />
              Starting soon
            </span>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
