import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessChip, Avatar, Chip } from "@/components/ui";
import { getConsultFor, patients, planNames } from "@/lib/data";
import type { AccessStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Patients" };

const filters: { value: AccessStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Record open" },
  { value: "pending", label: "Awaiting OTP" },
  { value: "expired", label: "Access expired" },
  { value: "none", label: "No access" },
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PatientsPage(props: PageProps<"/patients">) {
  const searchParams = await props.searchParams;
  const q = (first(searchParams.q) ?? "").trim();
  const access = first(searchParams.access) ?? "all";

  const needle = q.toLowerCase().replace(/\s+/g, "");
  const list = patients.filter((p) => {
    const haystack = `${p.name}${p.memberId}`.toLowerCase().replace(/\s+/g, "");
    return (access === "all" || p.access.status === access) && haystack.includes(needle);
  });

  const hrefFor = (value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value !== "all") params.set("access", value);
    const query = params.toString();
    return query ? `/patients?${query}` : "/patients";
  };

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-ink">Patients</h1>
      <p className="mt-2 max-w-2xl text-body">
        {q ? `Results for “${q}”. ` : ""}
        You see a patient’s name and alerts here. Their full history opens only with an OTP.
      </p>

      <nav aria-label="Filter by access" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = access === filter.value;
          return (
            <Link
              key={filter.value}
              href={hrefFor(filter.value)}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                active ? "bg-ink text-white" : "border border-line bg-card text-ink hover:bg-selected"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
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
            {list.map((patient) => {
              const consult = getConsultFor(patient.id);
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
                          {patient.age} years, {patient.sex}. {patient.memberId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-bold text-ink">{patient.bloodGroup}</td>
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
            No patients match. Check the spelling or the member ID, or{" "}
            <Link href="/patients" className="font-semibold text-brand underline">
              clear the search
            </Link>
            .
          </p>
        ) : null}
      </div>
    </>
  );
}
