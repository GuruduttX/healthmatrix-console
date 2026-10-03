import type { Metadata } from "next";
import Link from "next/link";

import { AccessChip, Avatar } from "@/components/ui";
import { accessLog, getPatient } from "@/lib/data";

export const metadata: Metadata = { title: "Access log" };

export default function AccessLogPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-ink">Access log</h1>
      <p className="mt-2 max-w-2xl text-body">
        Every record you request or open is listed here. Each patient sees the same entries in their app
        and can revoke access at any time.
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
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
