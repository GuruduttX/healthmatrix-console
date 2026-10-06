"use client";

import { Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { formatTime } from "@/lib/format";

/**
 * Re-reads the current screen from the database, so anything the app has added since
 * (consults, records, results) shows up. Only the data is fetched again: scroll position
 * and half-typed text stay as they are.
 */
export function CheckNewButton({ variant }: { variant: "sidebar" | "icon" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [justChecked, setJustChecked] = useState(false);

  useEffect(() => {
    if (!justChecked) return;
    const timer = setTimeout(() => setJustChecked(false), 2000);
    return () => clearTimeout(timer);
  }, [justChecked]);

  function check() {
    startTransition(() => {
      router.refresh();
      setCheckedAt(new Date());
      setJustChecked(true);
    });
  }

  const status = pending ? "Checking for new results…" : checkedAt ? `Up to date, checked at ${formatTime(checkedAt)}` : "";
  const Icon = justChecked && !pending ? Check : RefreshCw;

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={check}
          disabled={pending}
          aria-label="Check new results"
          title="Check new results"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-selected disabled:opacity-60"
        >
          <Icon aria-hidden className={`size-5 ${pending ? "animate-spin" : ""} ${justChecked && !pending ? "text-success" : ""}`} />
        </button>
        <span role="status" className="sr-only">
          {status}
        </span>
      </>
    );
  }

  return (
    <div className="mt-auto">
      <button
        type="button"
        onClick={check}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-70"
      >
        <Icon aria-hidden className={`size-4 ${pending ? "animate-spin" : ""} ${justChecked && !pending ? "text-success" : "text-brand-light"}`} />
        {pending ? "Checking…" : "Check new results"}
      </button>
      <p role="status" className="mt-2 min-h-4 text-center text-xs text-white/60">
        {checkedAt && !pending ? `Up to date, checked at ${formatTime(checkedAt)}` : pending ? "" : "Pulls in anything new from the app"}
      </p>
    </div>
  );
}
