"use client";

import {
  CircleCheck,
  LockOpen,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  RotateCw,
  SignalLow,
  UserCheck,
  Video,
  VideoOff,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type RefObject } from "react";
import type { LocalAudioTrack, LocalVideoTrack, RemoteParticipant, RemoteTrack, Room } from "twilio-video";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { admitPatient, endConsult, getConsultRoom } from "@/lib/console-actions";
import type { ConsultStatus } from "@/lib/types";

type Phase = "waiting" | "live" | "ended";

const initialPhase: Record<ConsultStatus, Phase> = {
  scheduled: "waiting",
  in_progress: "live",
  completed: "ended",
};

/** The doctor's own connection to the consult's room. */
type Connection =
  | { state: "connecting" }
  | { state: "connected" }
  | { state: "dropped" }
  | { state: "failed"; problem: string };

/** What the doctor can see of the patient in the room. Before Admit they publish nothing. */
type Remote = { present: boolean; videoOn: boolean; audioOn: boolean };
const NOBODY: Remote = { present: false, videoOn: false, audioOn: false };

type LocalMedia = LocalAudioTrack | LocalVideoTrack;

/** The app joins as `member-<memberId>`. */
const isPatient = (participant: RemoteParticipant) => participant.identity.startsWith("member-");

const HD = { width: 1280, height: 720 };

function clock(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const secondsSince = (iso?: string) => (iso ? Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000)) : 0);

/** A camera, microphone or Twilio failure, in words for the doctor. */
function problemOf(error: unknown, admitting?: string) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return admitting
      ? `Allow camera and microphone for this site to admit ${admitting}.`
      : "Allow camera and microphone for this site.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera or microphone was found.";
  if (name === "NotReadableError") return "Another app is using your camera or microphone.";
  if ((error as { code?: number } | null)?.code === 53105) return "Someone else is already in this call.";
  return "The call couldn’t connect. Check your connection and try again.";
}

const detach = (track: { detach(): HTMLMediaElement[] }) => track.detach().forEach((el) => el.remove());

function stopTracks(tracks: LocalMedia[]) {
  tracks.forEach((track) => {
    track.stop();
    detach(track);
  });
}

/** Shows the doctor's own camera in the corner. */
function showSelf(track: LocalVideoTrack, box: HTMLElement | null) {
  detach(track);
  box?.appendChild(track.attach());
}

/**
 * Sends the doctor's camera and mic to the room. For a consult that hasn't started, this is
 * what admits the member: their app takes the doctor's first audio or video track as the cue.
 */
async function publishMedia(room: Room, tracks: LocalMedia[], selfBox: HTMLElement | null) {
  tracks.forEach((track) => track.kind === "video" && showSelf(track, selfBox));
  await Promise.all(tracks.map((track) => room.localParticipant.publishTrack(track)));
}

function releasePreview(ref: RefObject<LocalVideoTrack | null>) {
  const track = ref.current;
  if (!track) return;
  track.stop();
  detach(track);
  ref.current = null;
}

/**
 * The video area of a consult, over Twilio Video. Opening it joins the consult's room without
 * camera or mic, so the doctor sees the patient arrive in the app's waiting room the moment
 * they do. Admit starts the consult and shares the doctor's camera and mic, which pulls the
 * patient into the call. Ending closes the room for both. It can fill the screen and shrink back.
 */
export function ConsultStage({
  consultId,
  startedAt,
  patientName,
  patientInitials,
  status,
  recordShared,
  time,
  videoReady,
}: {
  consultId: string;
  /** ISO time the call started, while it is in progress. */
  startedAt?: string;
  patientName: string;
  patientInitials: string;
  status: ConsultStatus;
  recordShared: boolean;
  time: string;
  /** Twilio Video's keys are set on this deployment. */
  videoReady: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(initialPhase[status]);
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt));
  const [pending, startTransition] = useTransition();
  const stageRef = useRef<HTMLElement>(null);
  /** Filling the screen. Browser full screen where allowed, else a fixed overlay (iPhone Safari). */
  const [expanded, setExpanded] = useState(false);

  const [connection, setConnection] = useState<Connection>({ state: "connecting" });
  /** Bumped to connect again after the call dropped or failed. */
  const [attempt, setAttempt] = useState(0);
  const [remote, setRemote] = useState<Remote>(NOBODY);
  /** When the patient entered the waiting room, as this browser saw it. */
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reconnecting, setReconnecting] = useState(false);
  const [weakConnection, setWeakConnection] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  /** Camera and mic are being shared with the room. */
  const [publishing, setPublishing] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  /** The camera preview before Admit couldn't start. */
  const [previewProblem, setPreviewProblem] = useState<string>();
  /** Camera and mic couldn't be shared: at Admit, or on joining a consult already in progress. */
  const [mediaProblem, setMediaProblem] = useState<string>();
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  const roomRef = useRef<Room | null>(null);
  /** The camera and mic shared with the room. */
  const localTracks = useRef<LocalMedia[]>([]);
  /** The doctor's camera before Admit: shown in the corner, never published while waiting. */
  const previewTrack = useRef<LocalVideoTrack | null>(null);
  /** The doctor chose to end, so the room closing isn't a dropped call. */
  const endingRef = useRef(false);
  const remoteVideoBox = useRef<HTMLDivElement>(null);
  const remoteAudioBox = useRef<HTMLDivElement>(null);
  const selfBox = useRef<HTMLDivElement>(null);

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

  // Join the consult's room, without camera or mic until the consult is in progress, and stay
  // in it until the consult ends or the page closes.
  useEffect(() => {
    if (!videoReady) return;
    let stopped = false;
    let connecting: { cancel(): void } | null = null;
    let room: Room | null = null;
    const leave = () => room?.disconnect();

    const showTrack = (track: RemoteTrack) => {
      if (track.kind === "data") return;
      const box = track.kind === "video" ? remoteVideoBox.current : remoteAudioBox.current;
      box?.appendChild(track.attach());
      const key = track.kind === "video" ? "videoOn" : "audioOn";
      setRemote((r) => ({ ...r, [key]: track.isEnabled }));
      track.on("enabled", () => setRemote((r) => ({ ...r, [key]: true })));
      track.on("disabled", () => setRemote((r) => ({ ...r, [key]: false })));
    };
    const hideTrack = (track: RemoteTrack) => {
      if (track.kind === "data") return;
      detach(track);
      track.removeAllListeners("enabled").removeAllListeners("disabled");
      setRemote((r) => ({ ...r, [track.kind === "video" ? "videoOn" : "audioOn"]: false }));
    };
    const arrive = (participant: RemoteParticipant) => {
      if (!isPatient(participant)) return;
      setRemote({ ...NOBODY, present: true });
      setArrivedAt(Date.now());
      participant.tracks.forEach(({ track }) => track && showTrack(track));
      participant.on("trackSubscribed", showTrack);
      participant.on("trackUnsubscribed", hideTrack);
    };
    const part = (participant: RemoteParticipant) => {
      if (!isPatient(participant)) return;
      participant.tracks.forEach(({ track }) => track && hideTrack(track));
      participant.off("trackSubscribed", showTrack);
      participant.off("trackUnsubscribed", hideTrack);
      setRemote(NOBODY);
      setArrivedAt(null);
    };
    const clearRemote = () => {
      remoteVideoBox.current?.replaceChildren();
      remoteAudioBox.current?.replaceChildren();
    };
    const unpublish = () => {
      stopTracks(localTracks.current);
      localTracks.current = [];
      setPublishing(false);
    };

    (async () => {
      const access = await getConsultRoom(consultId);
      if (stopped) return;
      if ("error" in access) {
        if (access.ended) setPhase("ended");
        else setConnection({ state: "failed", problem: access.error });
        return;
      }

      let joined: Room;
      try {
        const { connect } = await import("twilio-video");
        if (stopped) return;
        // Listening only: publishing camera or mic now would admit the patient.
        const opening = connect(access.token, {
          name: access.roomName,
          tracks: [],
          networkQuality: { local: 1, remote: 1 },
        });
        connecting = opening;
        joined = await opening;
      } catch (error) {
        if (!stopped) setConnection({ state: "failed", problem: problemOf(error) });
        return;
      }
      if (stopped) {
        joined.disconnect();
        return;
      }

      room = joined;
      roomRef.current = joined;
      joined.localParticipant.on("networkQualityLevelChanged", (level: number) => setWeakConnection(level <= 1));
      joined.participants.forEach(arrive);
      joined.on("participantConnected", arrive);
      joined.on("participantDisconnected", part);
      joined.on("reconnecting", () => setReconnecting(true));
      joined.on("reconnected", () => setReconnecting(false));
      joined.on("disconnected", () => {
        window.removeEventListener("pagehide", leave);
        unpublish();
        clearRemote();
        roomRef.current = null;
        setRemote(NOBODY);
        setArrivedAt(null);
        setReconnecting(false);
        setWeakConnection(false);
        if (!stopped && !endingRef.current) setConnection({ state: "dropped" });
      });
      window.addEventListener("pagehide", leave);
      setConnection({ state: "connected" });

      // Already in progress (a reload, or a rejoin): no Admit, share camera and mic at once.
      if (access.status !== "in_progress") return;
      setPhase("live");
      try {
        const { createLocalTracks } = await import("twilio-video");
        const tracks = (await createLocalTracks({ audio: true, video: HD })) as LocalMedia[];
        if (stopped || roomRef.current !== joined) return stopTracks(tracks);
        localTracks.current = tracks;
        setPublishing(true);
        await publishMedia(joined, tracks, selfBox.current);
      } catch (error) {
        if (!stopped) setMediaProblem(problemOf(error));
      }
    })();

    return () => {
      stopped = true;
      connecting?.cancel();
      window.removeEventListener("pagehide", leave);
      unpublish();
      room?.disconnect();
      clearRemote();
      roomRef.current = null;
    };
  }, [consultId, videoReady, attempt]);

  // Before Admit: the doctor's camera in the corner, to check how they look. Not published.
  useEffect(() => {
    if (phase !== "waiting" || !videoReady) return;
    let stopped = false;
    (async () => {
      try {
        const { createLocalVideoTrack } = await import("twilio-video");
        const track = await createLocalVideoTrack(HD);
        if (stopped) return track.stop();
        previewTrack.current = track;
        showSelf(track, selfBox.current);
        setPreviewProblem(undefined);
      } catch (error) {
        if (!stopped) setPreviewProblem(problemOf(error));
      }
    })();
    return () => {
      stopped = true;
      releasePreview(previewTrack);
    };
  }, [phase, videoReady]);

  // "Waiting 2 min" keeps counting.
  useEffect(() => {
    if (arrivedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [arrivedAt]);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const firstName = patientName.split(" ")[0];

  /**
   * Gets camera and mic first, so a refused permission never leaves a consult started with the
   * patient pulled into an empty call. Then starts the consult and shares them.
   */
  async function admit() {
    const room = roomRef.current;
    if (!room || admitting) return;
    setAdmitting(true);
    setMediaProblem(undefined);

    let audio: LocalAudioTrack | undefined;
    let video: LocalVideoTrack;
    try {
      const { createLocalAudioTrack, createLocalVideoTrack } = await import("twilio-video");
      audio = await createLocalAudioTrack();
      video = previewTrack.current ?? (await createLocalVideoTrack(HD));
    } catch (error) {
      audio?.stop();
      setMediaProblem(problemOf(error, firstName));
      setAdmitting(false);
      return;
    }
    // The preview becomes the call's camera; nothing else may stop it now.
    previewTrack.current = null;

    let started: string | undefined;
    try {
      started = (await admitPatient(consultId)).status;
    } catch {
      started = undefined;
    }

    if (started !== "in_progress") {
      audio.stop();
      previewTrack.current = video;
      showSelf(video, selfBox.current);
      setAdmitting(false);
      if (started === "completed") setPhase("ended");
      else setMediaProblem(started ? "This consult can’t be started any more." : "Couldn’t admit just now. Try again.");
      return;
    }

    setSeconds(0);
    setMicOn(true);
    setCameraOn(true);
    setPhase("live");
    setAdmitting(false);
    if (roomRef.current !== room) return stopTracks([audio, video]);
    localTracks.current = [audio, video];
    setPublishing(true);
    try {
      await publishMedia(room, [audio, video], selfBox.current);
    } catch {
      setMediaProblem(`Your camera and microphone couldn’t reach ${firstName}. Use Rejoin if this keeps up.`);
    }
  }

  function rejoin() {
    setConnection({ state: "connecting" });
    setMicOn(true);
    setCameraOn(true);
    setMediaProblem(undefined);
    setAttempt((n) => n + 1);
  }

  function end() {
    setConfirmingEnd(false);
    endingRef.current = true;
    stopTracks(localTracks.current);
    localTracks.current = [];
    roomRef.current?.disconnect();
    startTransition(async () => {
      await endConsult(consultId);
      shrink();
      setPhase("ended");
    });
  }

  function toggleMic() {
    const on = !micOn;
    localTracks.current.forEach((track) => track.kind === "audio" && (on ? track.enable() : track.disable()));
    setMicOn(on);
  }

  function toggleCamera() {
    const on = !cameraOn;
    localTracks.current.forEach((track) => track.kind === "video" && (on ? track.enable() : track.disable()));
    setCameraOn(on);
  }

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
  const connected = connection.state === "connected";
  /** The patient is in the waiting room and can be admitted. */
  const inWaitingRoom = !live && connected && remote.present;
  const showPatient = live && connected && remote.present && remote.videoOn;
  /** The doctor's own picture in the corner: the preview before Admit, their call video after. */
  const selfVisible = live ? connected && cameraOn && publishing : !previewProblem;
  const waitedMinutes = arrivedAt === null ? 0 : Math.max(0, Math.floor((now - arrivedAt) / 60_000));

  /** The line under the patient's name, in place of their picture. */
  let message: string;
  let action: { label: string; onClick: () => void } | null = null;
  if (!videoReady) message = "Video calls are not set up.";
  else if (connection.state === "failed") {
    message = connection.problem;
    action = { label: "Try again", onClick: rejoin };
  } else if (connection.state === "dropped") {
    message = "Call dropped.";
    action = { label: "Rejoin", onClick: rejoin };
  } else if (connection.state === "connecting") message = "Connecting…";
  else if (inWaitingRoom) message = waitedMinutes < 1 ? "Just arrived" : `Waiting ${waitedMinutes} min`;
  else if (!live) message = `${firstName} hasn’t joined yet. You’ll see them here the moment they open the waiting room.`;
  else if (!remote.present) message = `Waiting for ${firstName} to rejoin…`;
  else message = `${firstName}’s camera is off`;

  const problem = live ? mediaProblem : (mediaProblem ?? previewProblem);

  return (
    <section
      ref={stageRef}
      aria-label="Video consult"
      className={`flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ink-mid to-ink text-white ${
        expanded ? "fixed inset-0 z-50 h-dvh w-full" : "relative aspect-video min-h-80 w-full rounded-3xl"
      }`}
    >
      <div
        ref={remoteVideoBox}
        aria-label={`${patientName}’s video`}
        className={`absolute inset-0 [&>video]:size-full [&>video]:object-cover ${showPatient ? "" : "hidden"}`}
      />
      <div ref={remoteAudioBox} hidden />

      <div
        className={`absolute inset-x-4 z-10 flex items-start justify-between gap-3 ${expanded ? "top-[calc(1rem+env(safe-area-inset-top))]" : "top-4"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {recordShared ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
              <LockOpen aria-hidden className="size-3.5" />
              {firstName}’s record shared by OTP
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">Record not shared yet</span>
          )}
          {live && connected && remote.present && !remote.audioOn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold">
              <MicOff aria-hidden className="size-3.5" />
              Muted
            </span>
          ) : null}
          {connected && reconnecting ? (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning">
              <WifiOff aria-hidden className="size-3.5" />
              Reconnecting…
            </span>
          ) : connected && weakConnection ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning">
              <SignalLow aria-hidden className="size-3.5" />
              Weak connection
            </span>
          ) : null}
        </div>
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

      {showPatient ? null : (
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <span className="relative inline-flex size-28 items-center justify-center">
            {inWaitingRoom ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-mid/40" /> : null}
            <span className="relative inline-flex size-28 items-center justify-center rounded-full bg-brand-mid font-display text-4xl font-bold">
              {patientInitials}
            </span>
          </span>
          <p className="mt-4 font-display text-2xl font-bold">
            {inWaitingRoom ? `${patientName} is in the waiting room` : patientName}
          </p>
          <p role="status" className="mt-1 max-w-md text-sm text-white/75">
            {message}
          </p>
          {!live && !inWaitingRoom && connected ? <p className="mt-1 text-sm text-white/60">Scheduled for {time}.</p> : null}
          {problem ? <p className="mt-2 max-w-md text-sm font-semibold text-brand-light">{problem}</p> : null}
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-white/85"
            >
              <RotateCw aria-hidden className="size-4" />
              {action.label}
            </button>
          ) : null}
          {inWaitingRoom ? (
            <button
              type="button"
              onClick={admit}
              disabled={admitting}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-base font-bold shadow-floating hover:bg-danger disabled:opacity-70"
            >
              <UserCheck aria-hidden className="size-5" />
              {admitting ? "Admitting…" : "Admit"}
            </button>
          ) : null}
        </div>
      )}

      {videoReady ? (
        <div
          aria-label={live ? "Your video" : "Your camera preview, not shared"}
          className={`absolute right-4 z-10 h-20 w-16 overflow-hidden rounded-xl border border-white/40 bg-ink-mid sm:top-auto [&>div>video]:size-full [&>div>video]:-scale-x-100 [&>div>video]:object-cover ${
            expanded
              ? "top-[calc(4rem+env(safe-area-inset-top))] sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:h-36 sm:w-28"
              : "top-16 sm:bottom-20 sm:h-24 sm:w-20"
          }`}
        >
          <div ref={selfBox} className={`size-full ${selfVisible ? "" : "hidden"}`} />
          {selfVisible ? null : (
            <span className="absolute inset-0 flex items-center justify-center">
              <VideoOff aria-hidden className="size-5 text-white/70" />
            </span>
          )}
        </div>
      ) : null}

      {live ? (
        <div
          className={`absolute z-10 flex items-center gap-3 ${expanded ? "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]" : "bottom-4"}`}
        >
          <button
            type="button"
            aria-pressed={!micOn}
            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            onClick={toggleMic}
            disabled={!publishing}
            className={`inline-flex size-12 items-center justify-center rounded-full disabled:opacity-50 ${micOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-ink"}`}
          >
            {micOn ? <Mic aria-hidden className="size-5" /> : <MicOff aria-hidden className="size-5" />}
          </button>
          <button
            type="button"
            aria-pressed={!cameraOn}
            aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
            onClick={toggleCamera}
            disabled={!publishing}
            className={`inline-flex size-12 items-center justify-center rounded-full disabled:opacity-50 ${cameraOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-ink"}`}
          >
            {cameraOn ? <Video aria-hidden className="size-5" /> : <VideoOff aria-hidden className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingEnd(true)}
            disabled={pending}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold hover:bg-danger disabled:opacity-60"
          >
            <PhoneOff aria-hidden className="size-5" />
            End consult
          </button>
        </div>
      ) : null}

      {confirmingEnd ? (
        <ConfirmDialog
          title="End this consult?"
          confirmLabel="End consult"
          cancelLabel="Stay in call"
          onConfirm={end}
          onCancel={() => setConfirmingEnd(false)}
        >
          The call ends for you and {firstName}, and the consult is marked done. It can’t be restarted.
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
