import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Chip, flagTone } from "@/components/ui";
import { getPatient, testOrders } from "@/lib/data";
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
  const list = testOrders.filter((t) => active === "all" || t.status === active);

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-ink">Results</h1>
      <p className="mt-2 max-w-2xl text-body">
        Tests you ordered are booked at a pod near the patient, and the results come back to you here.
      </p>

      <nav aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/results" : `/results?status=${filter.value}`}
            aria-current={active === filter.value ? "true" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              active === filter.value ? "bg-ink text-white" : "border border-line bg-card text-ink hover:bg-selected"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
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
              const patient = getPatient(order.patientId)!;
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
                    <Link href={`/patients/${patient.id}`} className="whitespace-nowrap font-bold text-brand hover:underline">
                      Open record
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-body">No tests with this status.</p>
        ) : null}
      </div>
    </>
  );
}
