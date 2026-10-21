import { ChevronRight, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MarkReviewedButton } from "@/components/mark-reviewed-button";
import { Avatar, Card, Chip, EmptyState, FilterTabs, flagTone, IconTile, PageHeader } from "@/components/ui";
import { getTestOrders } from "@/lib/console-data";
import type { TestOrderStatus, Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Results" };

const statusMeta: Record<TestOrderStatus, { label: string; tone: Tone }> = {
  result_back: { label: "New result", tone: "brand" },
  booked: { label: "Booked", tone: "neutral" },
  awaiting_booking: { label: "Not booked yet", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const filters: { value: TestOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "result_back", label: "New results" },
  { value: "booked", label: "Booked" },
  { value: "awaiting_booking", label: "Not booked yet" },
  { value: "reviewed", label: "Reviewed" },
];

export default async function ResultsPage(props: PageProps<"/results">) {
  const { status } = await props.searchParams;
  const active = typeof status === "string" ? status : "all";
  const list = await getTestOrders(active, { sync: true });
  const empty =
    active === "all"
      ? "No lab tests yet. Tests your patients book at a pod show here, with the ones you order, until the results are reviewed."
      : "No tests with this status.";

  return (
    <>
      <PageHeader
        title="Results"
        description="Every test your patients book at a pod, including the ones you order, with the results as they come back."
      >
        <FilterTabs
          label="Filter by status"
          active={active}
          items={filters.map((filter) => ({
            value: filter.value,
            label: filter.label,
            href: filter.value === "all" ? "/results" : `/results?status=${filter.value}`,
          }))}
        />
      </PageHeader>

      <ul className="glass-panel divide-y divide-line overflow-hidden rounded-2xl empty:hidden md:hidden">
        {list.map((order) => {
          const { patient } = order;
          const meta = statusMeta[order.status];
          return (
            <li key={order.id}>
              <Link
                href={`/patients/${patient.id}`}
                className={`flex items-start gap-3 px-4 pt-4 transition-colors active:bg-white/60 ${order.status === "result_back" ? "" : "pb-4"}`}
              >
                <IconTile icon={FlaskConical} tone={order.result ? flagTone[order.result.flag] : "neutral"} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-bold text-ink">{patient.name}</span>
                    <Chip tone={meta.tone} dot>
                      {meta.label}
                    </Chip>
                  </span>
                  <span className="mt-0.5 block text-[13px] font-semibold text-ink">{order.test}</span>
                  {order.result ? (
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold tabular-nums text-ink">{order.result.value}</span>
                      <Chip tone={flagTone[order.result.flag]}>{order.result.label}</Chip>
                      {order.isSample ? <Chip tone="warning">Sample values</Chip> : null}
                      <span className="text-xs text-muted">{order.result.date}</span>
                    </span>
                  ) : order.progress ? (
                    <span className="mt-0.5 block text-[13px] text-muted">{order.progress}</span>
                  ) : null}
                  <span className="mt-1 block text-xs text-muted">
                    {order.orderedOn ? `Ordered ${order.orderedOn}` : "Not ordered by you"} · {order.where}
                  </span>
                </span>
              </Link>
              {order.status === "result_back" ? (
                <div className="flex justify-end px-4 pb-4 pt-2.5">
                  <MarkReviewedButton orderId={order.id} what={`${patient.firstName}’s ${order.test}`} className="btn-sm" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* The pane stays put and the table scrolls inside it, so the glass's rim doesn't slide with the rows. */}
      <div className={`glass-panel hidden overflow-hidden rounded-2xl ${list.length ? "md:block" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-215 text-left text-[13px]">
            <thead className="whitespace-nowrap border-b border-line text-xs font-bold text-body">
              <tr>
                <th scope="col" className="px-5 py-3">Patient</th>
                <th scope="col" className="px-3 py-3">Test</th>
                <th scope="col" className="px-3 py-3">Ordered</th>
                <th scope="col" className="px-3 py-3">Where</th>
                <th scope="col" className="px-3 py-3">Result</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((order) => {
                const { patient } = order;
                const meta = statusMeta[order.status];
                return (
                  <tr key={order.id} className="transition-colors hover:bg-white/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                        <span className="whitespace-nowrap text-sm font-bold text-ink">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">{order.test}</td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-body">
                      {order.orderedOn ?? <span className="text-muted">Not by you</span>}
                    </td>
                    <td className="px-3 py-3 text-body">{order.where}</td>
                    <td className="px-3 py-3">
                      {order.result ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-display font-bold tabular-nums text-ink">{order.result.value}</span>
                          <Chip tone={flagTone[order.result.flag]}>{order.result.label}</Chip>
                          {order.isSample ? <Chip tone="warning">Sample values</Chip> : null}
                          <span className="w-full text-xs text-muted">{order.result.date}</span>
                        </div>
                      ) : (
                        <span className="text-muted">{order.progress ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Chip tone={meta.tone} dot>
                        {meta.label}
                      </Chip>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "result_back" ? (
                          <MarkReviewedButton orderId={order.id} what={`${patient.firstName}’s ${order.test}`} className="btn-sm" />
                        ) : null}
                        <Link href={`/patients/${patient.id}`} className="btn btn-ghost btn-sm">
                          Open record
                          <ChevronRight aria-hidden className="-mr-1 size-4" />
                        </Link>
                      </div>
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
          <EmptyState icon={FlaskConical} tone="neutral" title={active === "all" ? "No tests yet" : "Nothing here"}>
            {empty}
          </EmptyState>
        </Card>
      ) : null}
    </>
  );
}
