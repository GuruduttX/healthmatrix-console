import { FileSignature, FlaskConical, Sparkles, Video } from "lucide-react";
import Link from "next/link";

import { ConsultRow } from "@/components/consult-row";
import { Avatar, Card, CardTitle, Chip, flagTone } from "@/components/ui";
import { consults, doctor, ekaayFlags, getPatient, patients, prescriptions, testOrders } from "@/lib/data";
import type { Tone } from "@/lib/types";

const dotTone: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-brand",
  neutral: "bg-muted",
};

export default function TodayPage() {
  const today = consults.filter((c) => !c.day);
  const remaining = today.filter((c) => c.status !== "completed").length;
  const drafts = prescriptions.filter((p) => p.status === "draft");
  const newResults = testOrders.filter((t) => t.status === "result_back");

  const stats = [
    { label: "Consults today", value: today.length, hint: `${remaining} still to go`, href: "/schedule" },
    {
      label: "Records open",
      value: patients.filter((p) => p.access.status === "active").length,
      hint: "Shared by OTP, expire in 24 h",
      href: "/patients?access=active",
    },
    {
      label: "Drafts to sign",
      value: drafts.length,
      hint: "Prescriptions ready for review",
      href: "/prescriptions",
    },
    { label: "New results", value: newResults.length, hint: "Tests you ordered, not yet reviewed", href: "/results" },
  ];

  return (
    <>
      <p className="text-sm font-semibold text-brand">Today</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-ink">Good morning, {doctor.name}</h1>
      <p className="mt-2 max-w-2xl text-body">
        {remaining} consults to go. Ekaay has a summary ready for every patient who has shared their record.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="block rounded-2xl border border-line bg-card p-5 shadow-card hover:border-brand-light"
            >
              <span className="block text-sm font-semibold text-body">{stat.label}</span>
              <span className="mt-2 block font-display text-4xl font-bold text-ink">{stat.value}</span>
              <span className="mt-1 block text-xs text-body">{stat.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card flush>
          <div className="flex items-center justify-between px-5 pt-5">
            <CardTitle icon={Video}>Today’s consults</CardTitle>
            <Link href="/schedule" className="text-sm font-semibold text-brand hover:underline">
              Full schedule
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {today.map((consult) => (
              <ConsultRow key={consult.id} consult={consult} />
            ))}
          </ul>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card highlight>
            <CardTitle icon={Sparkles}>Ekaay noticed</CardTitle>
            <ul className="mt-4 flex flex-col gap-4">
              {ekaayFlags.map((flag) => {
                const patient = getPatient(flag.patientId)!;
                return (
                  <li key={flag.patientId} className="flex gap-3">
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${dotTone[flag.tone]}`} />
                    <p className="text-sm leading-relaxed text-ink">
                      <Link href={`/patients/${patient.id}`} className="font-bold hover:underline">
                        {patient.name}
                      </Link>
                      <br />
                      {flag.text}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-body">Ekaay informs. Doctors diagnose.</p>
          </Card>

          <Card>
            <CardTitle icon={FileSignature}>Prescriptions to sign</CardTitle>
            <ul className="mt-3 divide-y divide-line">
              {drafts.map((draft) => {
                const patient = getPatient(draft.patientId)!;
                return (
                  <li key={draft.id} className="flex items-center gap-3 py-3">
                    <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{patient.name}</p>
                      <p className="text-xs text-body">
                        {draft.items.length} items. {draft.source}
                      </p>
                    </div>
                    <Link href={`/prescriptions/${draft.id}`} className="text-sm font-bold text-brand hover:underline">
                      Review
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardTitle icon={FlaskConical}>New results</CardTitle>
            <ul className="mt-3 divide-y divide-line">
              {newResults.map((order) => {
                const patient = getPatient(order.patientId)!;
                return (
                  <li key={order.id} className="py-3">
                    <p className="text-sm font-semibold text-ink">
                      {patient.name}: {order.test}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-body">
                      {order.result!.value}
                      <Chip tone={flagTone[order.result!.flag]}>{order.result!.label}</Chip>
                    </p>
                  </li>
                );
              })}
            </ul>
            <Link href="/results" className="mt-2 inline-block text-sm font-bold text-brand hover:underline">
              All results
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
