import { ChevronRight, FileSignature, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Card, Chip, EmptyState, FilterTabs, PageHeader } from "@/components/ui";
import { getPrescriptions } from "@/lib/console-data";
import type { Prescription } from "@/lib/types";

export const metadata: Metadata = { title: "Prescriptions" };

const count = (n: number, word: string) => (n ? `${n} ${word}${n === 1 ? "" : "s"}` : "");

/** "Paracetamol 500 mg; ORS +2 lab tests +1 vaccine", or "1 vaccine" when it is only vaccines. */
function rxSummary(rx: Prescription) {
  const extras = [count(rx.tests.length, "lab test"), count(rx.vaccineCount, "vaccine")].filter(Boolean);
  if (!rx.items.length) return extras.join(", ");
  return [rx.items.join("; "), ...extras.map((extra) => `+${extra}`)].join(" ");
}

const filters = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts to sign" },
  { value: "signed", label: "Signed" },
];

export default async function PrescriptionsPage(props: PageProps<"/prescriptions">) {
  const { status } = await props.searchParams;
  const active = typeof status === "string" ? status : "all";
  const list = await getPrescriptions(active);
  const empty =
    active === "draft"
      ? "No drafts waiting to be signed."
      : active === "signed"
        ? "You haven’t signed a prescription yet."
        : "No prescriptions yet. Start one from a patient’s record or with New prescription.";

  const statusChip = (rx: Prescription) => (
    <Chip tone={rx.status === "signed" ? "success" : "warning"}>{rx.status === "signed" ? "Signed" : "Draft"}</Chip>
  );

  return (
    <>
      <PageHeader
        title="Prescriptions"
        description="For any patient whose record is open to you. Nothing reaches a patient until you sign it."
        actions={
          <Link href="/prescriptions/new" className="btn btn-primary">
            <Plus aria-hidden className="size-4.5" />
            New prescription
          </Link>
        }
      >
        <FilterTabs
          label="Filter by status"
          active={active}
          items={filters.map((filter) => ({
            value: filter.value,
            label: filter.label,
            href: filter.value === "all" ? "/prescriptions" : `/prescriptions?status=${filter.value}`,
          }))}
        />
      </PageHeader>

      <ul className="glass-panel divide-y divide-line overflow-hidden rounded-2xl empty:hidden md:hidden">
        {list.map((rx) => {
          const { patient } = rx;
          return (
            <li key={rx.id}>
              <Link href={`/prescriptions/${rx.id}`} className="flex items-start gap-3 px-4 py-4 transition-colors active:bg-white/60">
                <Avatar initials={patient.initials} tone={patient.avatarTone} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-bold text-ink">{patient.name}</span>
                    {statusChip(rx)}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink">{rxSummary(rx)}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {rx.date} · {rx.source}
                  </span>
                </span>
                <ChevronRight aria-hidden className="mt-3 size-4.5 shrink-0 text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* The pane stays put and the table scrolls inside it, so the glass's rim doesn't slide with the rows. */}
      <div className={`glass-panel hidden overflow-hidden rounded-2xl ${list.length ? "md:block" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-[13px]">
            <thead className="whitespace-nowrap border-b border-line text-xs font-bold text-body">
              <tr>
                <th scope="col" className="px-5 py-3">Patient</th>
                <th scope="col" className="px-3 py-3">Items</th>
                <th scope="col" className="px-3 py-3">Drafted from</th>
                <th scope="col" className="px-3 py-3">Date</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((rx) => {
                const { patient } = rx;
                return (
                  <tr key={rx.id} className="transition-colors hover:bg-white/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                        <span className="whitespace-nowrap text-sm font-bold text-ink">{patient.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-3 py-3.5 text-ink">
                      <span className="line-clamp-1">{rxSummary(rx)}</span>
                    </td>
                    <td className="px-3 py-3.5 text-body">{rx.source}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-body">{rx.date}</td>
                    <td className="px-3 py-3.5">{statusChip(rx)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/prescriptions/${rx.id}`}
                        className={`btn btn-sm ${rx.status === "signed" ? "btn-ghost" : "btn-soft"}`}
                      >
                        {rx.status === "signed" ? "View" : "Review and sign"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {list.length === 0 ? (
        <Card flush>
          <EmptyState icon={FileSignature} title={active === "draft" ? "Nothing to sign" : "No prescriptions"}>
            {empty}
          </EmptyState>
        </Card>
      ) : null}
    </>
  );
}
