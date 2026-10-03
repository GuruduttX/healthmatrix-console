import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Chip } from "@/components/ui";
import { getPatient, prescriptions } from "@/lib/data";

export const metadata: Metadata = { title: "Prescriptions" };

const filters = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts to sign" },
  { value: "signed", label: "Signed" },
];

export default async function PrescriptionsPage(props: PageProps<"/prescriptions">) {
  const { status } = await props.searchParams;
  const active = typeof status === "string" ? status : "all";
  const list = prescriptions.filter((p) => active === "all" || p.status === active);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Prescriptions</h1>
          <p className="mt-2 max-w-2xl text-body">
            Ekaay drafts from your voice note or a photo of your note. Nothing reaches a patient
            until you sign it.
          </p>
        </div>
        <Link
          href="/prescriptions/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-danger sm:w-auto sm:py-2.5"
        >
          <Plus aria-hidden className="size-4" />
          New prescription
        </Link>
      </div>

      <nav aria-label="Filter by status" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/prescriptions" : `/prescriptions?status=${filter.value}`}
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
        {list.map((rx) => {
          const patient = getPatient(rx.patientId)!;
          return (
            <li key={rx.id}>
              <Link href={`/prescriptions/${rx.id}`} className="flex items-center gap-3 px-4 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{patient.name}</span>
                    <Chip tone={rx.status === "signed" ? "success" : "warning"}>
                      {rx.status === "signed" ? "Signed" : "Draft"}
                    </Chip>
                  </span>
                  <span className="mt-2.5 line-clamp-2 text-sm text-ink">{rx.items.join("; ")}</span>
                  <span className="mt-1.5 block text-xs text-body">
                    {rx.date}. {rx.source}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-body" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-card md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold text-body">
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
              const patient = getPatient(rx.patientId)!;
              return (
                <tr key={rx.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                      <span className="font-semibold text-ink">{patient.name}</span>
                    </div>
                  </td>
                  <td className="max-w-xs px-3 py-3.5 text-body">
                    <span className="line-clamp-1">{rx.items.join("; ")}</span>
                  </td>
                  <td className="px-3 py-3.5 text-body">{rx.source}</td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-body">{rx.date}</td>
                  <td className="px-3 py-3.5">
                    <Chip tone={rx.status === "signed" ? "success" : "warning"}>
                      {rx.status === "signed" ? "Signed" : "Draft"}
                    </Chip>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/prescriptions/${rx.id}`} className="whitespace-nowrap font-bold text-brand hover:underline">
                      {rx.status === "signed" ? "View" : "Review and sign"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
