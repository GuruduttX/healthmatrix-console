import { Suspense } from "react";

import { Bone } from "@/components/skeletons";
import { getRecordSummary } from "@/lib/console-data";

/**
 * Ekaay's summary lines: the consult's own when there is one, otherwise one Ekaay writes from the
 * whole record. That one arrives after the rest of the page, so the doctor isn't kept waiting.
 * Shared by the patient page's summary card and the consult panel. `className` spaces it from the
 * heading above.
 */
export function EkaaySummary({
  memberId,
  patientName,
  lines,
  className = "mt-3.5",
}: {
  memberId: string;
  patientName: string;
  /** The consult's summary, empty when there isn't one. */
  lines: string[];
  className?: string;
}) {
  if (lines.length > 0) return <SummaryLines lines={lines} className={className} />;
  return (
    <Suspense fallback={<SummaryBones patientName={patientName} className={className} />}>
      <RecordSummary memberId={memberId} patientName={patientName} className={className} />
    </Suspense>
  );
}

async function RecordSummary({ memberId, patientName, className }: { memberId: string; patientName: string; className: string }) {
  const summary = await getRecordSummary(memberId);
  if (!summary) return null;
  if (summary.status === "written") return <SummaryLines lines={summary.lines} className={className} />;

  const note = {
    too_little: `There isn’t enough data in ${patientName}’s record for a summary yet.`,
    failed: "Ekaay couldn’t write a summary just now. Reload the page to try again.",
    off: `No summary for ${patientName} yet.`,
  }[summary.status];
  return <p className={`${className} text-[13px] leading-relaxed text-body`}>{note}</p>;
}

function SummaryLines({ lines, className }: { lines: string[]; className: string }) {
  return (
    <ul className={`${className} flex flex-col gap-2.5`}>
      {lines.map((line) => (
        <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
          {line}
        </li>
      ))}
    </ul>
  );
}

/** While Ekaay reads the record: pulsing lines, as on the loading screens. */
function SummaryBones({ patientName, className }: { patientName: string; className: string }) {
  return (
    <div role="status" className={`skeleton-page ${className}`}>
      <p className="text-[13px] text-muted">Ekaay is reading {patientName}’s record…</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {["w-full", "w-4/5", "w-1/2"].map((width) => (
          <Bone key={width} className={`h-3.5 ${width}`} />
        ))}
      </div>
    </div>
  );
}
