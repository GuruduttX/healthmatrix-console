"use client";

import { Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useLiveUpdates } from "@/components/live-updates";
import { formatTime } from "@/lib/format";

/**
 * Re-reads the current screen from the database, so anything the app has added since
 * (consults, requests, records, results) shows up. Every screen also does this on its own
 * every 30 seconds; see `LiveUpdates`.
 */
export function CheckNewButton({
  variant,
  collapsed = false,
}: {
  variant: "sidebar" | "icon" | "glass";
  /** Sidebar folded to its icons: just the button, with the live dot on it. */
  collapsed?: boolean;
}) {
  const { check, checking, checkedAt } = useLiveUpdates();
  /** The doctor pressed it and the check is done: a tick for two seconds. */
  const [justChecked, setJustChecked] = useState(false);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (!asked || checking) return;
    /* eslint-disable react-hooks/set-state-in-effect -- the tick follows the check finishing */
    setAsked(false);
    setJustChecked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [asked, checking]);

  useEffect(() => {
    if (!justChecked) return;
    const timer = setTimeout(() => setJustChecked(false), 2000);
    return () => clearTimeout(timer);
  }, [justChecked]);

  function press() {
    setAsked(true);
    check();
  }

  const updated = checkedAt ? `Updated at ${formatTime(checkedAt)}` : "";
  const Icon = justChecked ? Check : RefreshCw;
  const spinning = checking && asked;

  if (variant !== "sidebar") {
    // `glass` sits on a dark header, round like the app's header buttons.
    const glass = variant === "glass";
    return (
      <>
        <button
          type="button"
          onClick={press}
          disabled={spinning}
          aria-label="Check for updates"
          title={updated || "Check for updates"}
          className={glass ? "btn btn-glass btn-icon size-11 min-h-11 disabled:opacity-100" : "btn btn-ghost btn-icon text-ink"}
        >
          <Icon
            aria-hidden
            className={`size-4.5 ${spinning ? "animate-spin" : ""} ${justChecked ? (glass ? "text-brand-light" : "text-brand") : ""}`}
          />
        </button>
        <span role="status" className="sr-only">
          {spinning ? "Checking for updates…" : justChecked ? `Up to date. ${updated}` : ""}
        </span>
      </>
    );
  }

  const motion = "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

  return (
    <div
      className={`group relative flex items-center justify-center rounded-full border border-line bg-surface py-1 pr-1 transition-[padding] ${motion} ${
        collapsed ? "pl-1" : "pl-3.5"
      }`}
    >
      <p
        role="status"
        className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-body transition-[max-width,opacity] ${motion} ${
          collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100"
        }`}
      >
        <span aria-hidden className="relative inline-flex size-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-success/40 motion-safe:animate-ping" />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
        <span className="truncate">
          {spinning ? "Checking…" : checkedAt ? `Live · updated ${formatTime(checkedAt)}` : "Live · every 30 s"}
        </span>
      </p>
      <button
        type="button"
        onClick={press}
        disabled={spinning}
        aria-label="Check for updates"
        title={collapsed ? "Live, every 30 s. Check for updates" : "Check for updates"}
        className="btn btn-ghost btn-sm btn-icon relative shrink-0"
      >
        <Icon aria-hidden className={`size-4 ${spinning ? "animate-spin" : ""} ${justChecked ? "text-brand" : ""}`} />
        <span
          aria-hidden
          className={`absolute right-1 top-1 size-2 rounded-full bg-success ring-2 ring-surface transition-opacity ${motion} ${collapsed ? "opacity-100" : "opacity-0"}`}
        />
      </button>
    </div>
  );
}
