import { ChevronRight, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessChip, Avatar, Chip } from "@/components/ui";
import { getPatients } from "@/lib/console-data";
import { ageAndSex, demographics, planNames } from "@/lib/patient-text";
import type { AccessStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Patients" };

const filters: { value: AccessStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Record open" },
  { value: "pending", label: "Awaiting OTP" },
  { value: "expired", label: "Access expired" },
  { value: "revoked", label: "Revoked" },
  { value: "none", label: "No access" },
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PatientsPage(props: PageProps<"/patients">) {
  const searchParams = await props.searchParams;
  const q = (first(searchParams.q) ?? "").trim();
  const access = first(searchParams.access) ?? "all";

  const list = await getPatients({ q, access });

  const filtered = Boolean(q) || access !== "all";
  const empty = filtered ? (
    <>
      No patients match. Check the spelling or the 12-digit member ID, or{" "}
      <Link href="/patients" className="font-semibold text-brand underline">
        clear the search
      </Link>
      .
    </>
  ) : (
    "No patients yet. Members appear here once they book a consult with you or you ask for their record. Search their member ID to find them."
  );

  const hrefFor = (value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value !== "all") params.set("access", value);
    const query = params.toString();
    return query ? `/patients?${query}` : "/patients";
  };

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Patients</h1>
      <p className="mt-2 max-w-2xl text-body">
        {q ? `Results for “${q}”. ` : ""}
        You see a patient’s name and alerts here. Their full history opens only with an OTP. To find
        someone new, search for their 12-digit member ID.
      </p>

      <nav aria-label="Filter by access" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((filter) => {
          const active = access === filter.value;
          return (
            <Link
              key={filter.value}
              href={hrefFor(filter.value)}
              aria-current={active ? "true" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                active ? "bg-ink text-white" : "border border-line bg-card text-ink hover:bg-selected"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {/* Phones get a tappable list; the table needs more width than they have. */}
      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card md:hidden">
        {list.map(({ patient, todayConsult: consult }) => {
          return (
            <li key={patient.id}>
              <Link href={`/patients/${patient.id}`} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar initials={patient.initials} tone={patient.avatarTone} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{patient.name}</span>
                  <span className="block text-xs text-body">
                    {demographics(patient)}
                  </span>
                  <span className="block text-xs text-body">{patient.memberId}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <AccessChip status={patient.access.status} />
                    {consult ? <Chip tone="neutral">Today, {consult.time}</Chip> : null}
                    {patient.allergies.map((allergy) => (
                      <Chip key={allergy} tone="danger" icon={TriangleAlert}>
                        Allergy: {allergy}
                      </Chip>
                    ))}
                    {patient.conditions.map((condition) => (
                      <Chip key={condition} tone="danger" icon={TriangleAlert}>
                        {condition}
                      </Chip>
                    ))}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-body" />
              </Link>
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold text-body">
            <tr>
              <th scope="col" className="px-5 py-3">Patient</th>
              <th scope="col" className="px-3 py-3">Blood group</th>
              <th scope="col" className="px-3 py-3">Plan</th>
              <th scope="col" className="px-3 py-3">Alerts</th>
              <th scope="col" className="px-3 py-3">Today</th>
              <th scope="col" className="px-3 py-3">Access</th>
              <th scope="col" className="px-5 py-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map(({ patient, todayConsult: consult }) => {
              const about = ageAndSex(patient);
              const alerts = [...patient.allergies.map((a) => `Allergy: ${a}`), ...patient.conditions];
              return (
                <tr key={patient.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={patient.initials} tone={patient.avatarTone} />
                      <div>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="font-semibold text-ink hover:underline"
                        >
                          {patient.name}
                        </Link>
                        <p className="text-xs text-body">
                          {about ? `${about}. ` : ""}
                          {patient.memberId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-bold text-ink">{patient.bloodGroup ?? "–"}</td>
                  <td className="px-3 py-3.5 text-body">{planNames[patient.plan]}</td>
                  <td className="px-3 py-3.5">
                    {alerts.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {alerts.map((alert) => (
                          <Chip key={alert} tone="danger" icon={TriangleAlert}>
                            {alert}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <span className="text-body">None recorded</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-body">{consult ? consult.time : "No consult"}</td>
                  <td className="px-3 py-3.5">
                    <AccessChip status={patient.access.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="whitespace-nowrap font-bold text-brand hover:underline"
                    >
                      {patient.access.status === "active" ? "Open record" : "Request access"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-body">
            {empty}
          </p>
        ) : null}
      </div>
    </>
  );
}
