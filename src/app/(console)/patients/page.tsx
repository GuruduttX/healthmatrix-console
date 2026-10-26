import { ChevronRight, SearchX, TriangleAlert, Users, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PatientSearch, PatientSearchFallback } from "@/components/patient-search";
import { AccessChip, Avatar, Card, Chip, EmptyState, FilterTabs, PageHeader } from "@/components/ui";
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

  const hrefFor = (value: string, search = q) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (value !== "all") params.set("access", value);
    const query = params.toString();
    return query ? `/patients?${query}` : "/patients";
  };

  const rows = list.map(({ patient, todayConsult: consult }) => ({
    patient,
    consult,
    about: ageAndSex(patient),
    alerts: [
      ...patient.allergies.map((a) => ({ text: `Allergy: ${a}`, allergy: true })),
      ...patient.conditions.map((c) => ({ text: c, allergy: false })),
    ],
  }));

  return (
    <>
      <PageHeader
        title="Patients"
        description="Names and alerts are here. A patient’s full history opens only with their OTP."
      >
        {/* Wide screens search from the top bar. */}
        <div className="mb-3 lg:hidden">
          <Suspense fallback={<PatientSearchFallback variant="hero" />}>
            <PatientSearch variant="hero" />
          </Suspense>
        </div>
        <FilterTabs
          label="Filter by access"
          active={access}
          items={filters.map((filter) => ({ value: filter.value, label: filter.label, href: hrefFor(filter.value) }))}
        />
      </PageHeader>

      {q ? (
        <p className="-mt-1 mb-4 flex flex-wrap items-center gap-2 text-[13px] text-body">
          {list.length} {list.length === 1 ? "result" : "results"} for
          <Link href={hrefFor(access, "")} className="chip min-h-8 gap-1 py-0 pl-3 pr-2 text-[13px] text-ink">
            “{q}”
            <X aria-hidden className="size-3.5 text-muted" />
            <span className="sr-only">, clear the search</span>
          </Link>
        </p>
      ) : null}

      {/* Phones get a tappable list on a pane of glass; the table needs more width than they have. */}
      <ul className="glass-panel divide-y divide-line overflow-hidden rounded-2xl empty:hidden md:hidden">
        {rows.map(({ patient, consult, alerts }) => (
          <li key={patient.id}>
            <Link href={`/patients/${patient.id}`} className="flex items-start gap-3 px-4 py-4 transition-colors active:bg-white/60">
              <Avatar initials={patient.initials} tone={patient.avatarTone} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-bold text-ink">{patient.name}</span>
                  {consult ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${consult.missed ? "bg-white/70 text-muted" : "bg-brand-soft text-brand-deep"}`}
                    >
                      {consult.missed ? "Missed" : "Today"} {consult.time}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-body">{demographics(patient)}</span>
                <span className="block text-xs tabular-nums text-muted">{patient.memberId}</span>
                <span className="mt-2.5 flex flex-wrap gap-1.5">
                  <AccessChip status={patient.access.status} />
                  {alerts.map((alert) => (
                    <Chip key={alert.text} tone={alert.allergy ? "danger" : "warning"} icon={alert.allergy ? TriangleAlert : undefined}>
                      {alert.text}
                    </Chip>
                  ))}
                </span>
              </span>
              <ChevronRight aria-hidden className="mt-3 size-4.5 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      {/* The pane clips, the box inside it scrolls sideways: the glass's rim stays put on narrow screens. */}
      {list.length > 0 ? (
        <div className="glass-panel hidden overflow-hidden rounded-2xl md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-205 text-left text-[13px]">
              <thead className="whitespace-nowrap border-b border-line text-xs font-bold text-body">
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
                {rows.map(({ patient, consult, about, alerts }) => (
                  <tr key={patient.id} className="group transition-colors hover:bg-white/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/patients/${patient.id}`} className="text-sm font-bold text-ink hover:underline">
                            {patient.name}
                          </Link>
                          <p className="text-xs text-muted">
                            {about ? `${about} · ` : ""}
                            <span className="whitespace-nowrap tabular-nums">{patient.memberId}</span>
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
                            <Chip key={alert.text} tone={alert.allergy ? "danger" : "warning"} icon={alert.allergy ? TriangleAlert : undefined}>
                              {alert.text}
                            </Chip>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">None recorded</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 tabular-nums text-body">
                      {consult ? (
                        consult.missed ? (
                          <span className="text-muted">{consult.time}, missed</span>
                        ) : (
                          <span className="font-semibold text-ink">{consult.time}</span>
                        )
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <AccessChip status={patient.access.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        className={`btn btn-sm ${patient.access.status === "active" ? "btn-secondary" : "btn-soft"}`}
                      >
                        {patient.access.status === "active" ? "Open record" : "Request access"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {list.length === 0 ? (
        <Card flush>
          {filtered ? (
            <EmptyState icon={SearchX} tone="neutral" title={q ? `Nothing matches “${q}”` : "No patients match"}>
              Check the spelling or the 12-digit member ID, or{" "}
              <Link href="/patients" className="font-bold text-brand-deep">
                clear the search
              </Link>
              .
            </EmptyState>
          ) : (
            <EmptyState icon={Users} title="No patients yet">
              Members appear here once they book a consult with you or you ask for their record. Search their member ID to
              find them.
            </EmptyState>
          )}
        </Card>
      ) : null}
    </>
  );
}
