import type { Metadata } from "next";
import Link from "next/link";

import { AccessChip, Avatar } from "@/components/ui";
import { accessLog, getPatient } from "@/lib/data";

export const metadata: Metadata = { title: "Access log" };

export default function AccessLogPage() {
  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Access log</h1>
      <p className="mt-2 max-w-2xl text-body">
        Every record you request or open is listed here. Each patient sees the same entries in their app
        and can revoke access at any time.
      </p>

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card md:hidden">
        {accessLog.map((entry) => {
          const patient = getPatient(entry.patientId)!;
          return (
            <li key={entry.at + entry.patientId}>
              <Link href={`/patients/${patient.id}`} className="block px-4 py-3.5">
                <span className="flex items-center gap-2.5">
                  <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{patient.name}</span>
                  <AccessChip status={entry.status} />
                </span>
                <span className="mt-2.5 block text-sm text-ink">{entry.what}</span>
                <span className="mt-1 block text-xs text-body">
                  {entry.at}. OTP shared by: {entry.approvedBy}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-card md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold text-body">
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
              const patient = getPatient(entry.patientId)!;
              return (
                <tr key={entry.at + entry.patientId}>
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium text-ink">{entry.at}</td>
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="flex items-center gap-2.5 font-semibold text-ink hover:underline"
                    >
                      <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                      {patient.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-body">{entry.what}</td>
                  <td className="px-3 py-3.5 text-body">{entry.approvedBy}</td>
                  <td className="px-5 py-3.5">
                    <AccessChip status={entry.status} />
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
