import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Chip, flagTone } from "@/components/ui";
import { markResultReviewed } from "@/lib/console-actions";
import { getTestOrders } from "@/lib/console-data";
import type { TestOrderStatus, Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Results" };

const statusMeta: Record<TestOrderStatus, { label: string; tone: Tone }> = {
  result_back: { label: "New result", tone: "brand" },
  booked: { label: "Booked", tone: "neutral" },
  awaiting_booking: { label: "Not booked yet", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "success" },
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
  const list = await getTestOrders(active);
  const empty =
    active === "all"
      ? "No tests ordered yet. Tests you order for a patient are tracked here until the result comes back."
      : "No tests with this status.";

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Results</h1>
      <p className="mt-2 max-w-2xl text-body">
        Tests you ordered are booked at a pod near the patient, and the results come back to you here.
      </p>

      <nav aria-label="Filter by status" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/results" : `/results?status=${filter.value}`}
            aria-current={active === filter.value ? "true" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              active === filter.value ? "bg-ink text-white" : "border border-line bg-card text-ink hover:bg-selected"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card md:hidden">
        {list.map((order) => {
          const { patient } = order;
          const meta = statusMeta[order.status];
          return (
            <li key={order.id}>
              <Link href={`/patients/${patient.id}`} className="block px-4 py-3.5">
                <span className="flex items-center gap-2.5">
                  <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{patient.name}</span>
                  <Chip tone={meta.tone}>{meta.label}</Chip>
                </span>
                <span className="mt-2.5 block text-sm font-medium text-ink">{order.test}</span>
                {order.result ? (
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-ink">{order.result.value}</span>
                    <Chip tone={flagTone[order.result.flag]}>{order.result.label}</Chip>
                    <span className="text-xs text-body">{order.result.date}</span>
                  </span>
                ) : (
                  <span className="mt-1 block text-sm text-body">Waiting for the result</span>
                )}
                <span className="mt-1.5 block text-xs text-body">
                  Ordered {order.orderedOn}. {order.where}
                </span>
              </Link>
              {order.status === "result_back" ? (
                <form action={markResultReviewed.bind(null, order.id)} className="px-4 pb-3.5">
                  <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-selected">
                    Mark reviewed
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
      {list.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-line bg-card px-5 py-10 text-center text-body shadow-card md:hidden">
          {empty}
        </p>
      ) : null}

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-card md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold text-body">
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
                <tr key={order.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                      <span className="font-semibold text-ink">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-ink">{order.test}</td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-body">{order.orderedOn}</td>
                  <td className="px-3 py-3.5 text-body">{order.where}</td>
                  <td className="px-3 py-3.5">
                    {order.result ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{order.result.value}</span>
                        <Chip tone={flagTone[order.result.flag]}>{order.result.label}</Chip>
                        <span className="w-full text-xs text-body">{order.result.date}</span>
                      </div>
                    ) : (
                      <span className="text-body">Waiting</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <Chip tone={meta.tone}>{meta.label}</Chip>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {order.status === "result_back" ? (
                        <form action={markResultReviewed.bind(null, order.id)}>
                          <button type="submit" className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-sm font-bold text-ink hover:bg-selected">
                            Mark reviewed
                          </button>
                        </form>
                      ) : null}
                      <Link href={`/patients/${patient.id}`} className="whitespace-nowrap font-bold text-brand hover:underline">
                        Open record
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-body">{empty}</p>
        ) : null}
      </div>
    </>
  );
}
