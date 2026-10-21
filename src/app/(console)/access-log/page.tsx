import { History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AccessChip, Avatar, Card, EmptyState, PageHeader } from "@/components/ui";
import { getAccessLog } from "@/lib/console-data";

export const metadata: Metadata = { title: "Access log" };

export default async function AccessLogPage() {
  const accessLog = await getAccessLog();

  return (
    <>
      <PageHeader
        back={{ href: "/profile", label: "Profile and settings" }}
        title="Access log"
        description="Every record you request or open is listed here. Each patient sees the same entries in their app and can revoke access at any time."
      />

      {/* Phones: one pane of glass, a row per request. */}
      <ul className="glass-panel divide-y divide-line overflow-hidden rounded-2xl empty:hidden md:hidden">
        {accessLog.map((entry) => {
          const { patient } = entry;
          return (
            <li key={entry.id}>
              <Link href={`/patients/${patient.id}`} className="flex items-start gap-3 px-4 py-4 transition-colors active:bg-white/60">
                <Avatar initials={patient.initials} tone={patient.avatarTone} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-bold text-ink">{patient.name}</span>
                    <AccessChip status={entry.status} />
                  </span>
                  <span className="mt-1 block text-[13px] text-ink">{entry.what}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {entry.at} · OTP shared by {entry.approvedBy}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {accessLog.length === 0 ? (
        <Card flush>
          <EmptyState icon={History} title="Nothing yet">
            When you ask a patient for their record, the request is listed here.
          </EmptyState>
        </Card>
      ) : null}

      {/* Wider screens: a table on a pane of glass. It scrolls inside the pane, so the rim stays put. */}
      <div className={`glass-panel hidden overflow-hidden rounded-2xl ${accessLog.length === 0 ? "" : "md:block"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-[13px]">
            <thead className="whitespace-nowrap border-b border-line text-xs font-bold text-body">
              <tr>
                <th scope="col" className="px-5 py-3">When</th>
                <th scope="col" className="px-3 py-3">Patient</th>
                <th scope="col" className="px-3 py-3">What was opened</th>
                <th scope="col" className="px-3 py-3">OTP shared by</th>
                <th scope="col" className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accessLog.map((entry) => {
                const { patient } = entry;
                return (
                  <tr key={entry.id} className="transition-colors hover:bg-white/60">
                    <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-body">{entry.at}</td>
                    <td className="px-3 py-3">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-2.5 text-sm font-bold text-ink hover:underline">
                        <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                        {patient.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink">{entry.what}</td>
                    <td className="px-3 py-3 text-body">{entry.approvedBy}</td>
                    <td className="px-5 py-3">
                      <AccessChip status={entry.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
