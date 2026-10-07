import { Activity, ArrowRight, BellRing, FileSignature, FlaskConical, Video } from "lucide-react";
import Link from "next/link";

import { ConsultRow } from "@/components/consult-row";
import { Avatar, Card, CardTitle, Chip, flagTone } from "@/components/ui";
import {
  getAttentionFlags,
  getPrescriptions,
  getStartingSoon,
  getTestOrders,
  getTodayConsults,
  getTodayStats,
} from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { greeting } from "@/lib/format";
import type { Tone } from "@/lib/types";

const dotTone: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-brand",
  neutral: "bg-muted",
};

export default async function TodayPage() {
  const doctor = await getCurrentDoctor();
  const [today, counts, flags, drafts, newResults, startingSoon] = await Promise.all([
    getTodayConsults(),
    getTodayStats(),
    getAttentionFlags(),
    getPrescriptions("draft"),
    getTestOrders("result_back"),
    getStartingSoon(),
  ]);
  const remaining = today.filter((c) => c.status !== "completed").length;

  const stats = [
    { label: "Consults today", value: today.length, hint: `${remaining} still to go`, href: "/schedule" },
    {
      label: "Records open",
      value: counts.recordsOpen,
      hint: "Shared by OTP, expire in 24 h",
      href: "/patients?access=active",
    },
    {
      label: "Drafts to sign",
      value: counts.drafts,
      hint: "Prescriptions ready for review",
      href: "/prescriptions",
    },
    { label: "New results", value: counts.newResults, hint: "Tests you ordered, not yet reviewed", href: "/results" },
  ];

  return (
    <>
      <p className="text-sm font-semibold text-brand">Today</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-ink">
        {greeting()}, {doctor.name}
      </h1>
      <p className="mt-2 max-w-2xl text-body">
        {today.length === 0
          ? "No consults booked for today."
          : remaining === 0
            ? "All of today’s consults are done."
            : `${remaining} ${remaining === 1 ? "consult" : "consults"} to go.`}
      </p>

      {startingSoon.map((consult) => (
        <Link
          key={consult.id}
          href={`/consults/${consult.id}`}
          className="mt-5 flex items-center gap-3 rounded-2xl border border-warning bg-warning-soft px-5 py-4 text-sm text-ink hover:brightness-95"
        >
          <BellRing aria-hidden className="size-5 shrink-0 text-warning" />
          <span className="min-w-0 flex-1">
            <span className="font-bold">{consult.patient.name}</span>’s consult starts at {consult.time}.
            <span className="block text-body">{consult.reason}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-brand">
            Get ready
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </Link>
      ))}

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
          {today.length > 0 ? (
            <ul className="mt-3 divide-y divide-line">
              {today.map((consult) => (
                <ConsultRow key={consult.id} consult={consult} />
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-8 pt-6 text-sm text-body">
              When members book a video consult with you, it shows up here.
            </p>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardTitle icon={Activity}>Needs a look</CardTitle>
            {flags.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-4">
                {flags.map((flag) => (
                  <li key={flag.patient.id} className="flex gap-3">
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${dotTone[flag.tone]}`} />
                    <p className="text-sm leading-relaxed text-ink">
                      <Link href={`/patients/${flag.patient.id}`} className="font-bold hover:underline">
                        {flag.patient.name}
                      </Link>
                      <br />
                      {flag.text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-body">
                Out-of-range readings from records shared with you show up here.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle icon={FileSignature}>Prescriptions to sign</CardTitle>
            {drafts.length === 0 ? <p className="mt-3 text-sm text-body">No drafts waiting.</p> : null}
            <ul className="mt-3 divide-y divide-line">
              {drafts.slice(0, 5).map((draft) => {
                const { patient } = draft;
                return (
                  <li key={draft.id} className="flex items-center gap-3 py-3">
                    <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{patient.name}</p>
                      <p className="text-xs text-body">
                        {[
                          draft.items.length ? `${draft.items.length} ${draft.items.length === 1 ? "item" : "items"}` : "",
                          draft.vaccineCount ? `${draft.vaccineCount} ${draft.vaccineCount === 1 ? "vaccine" : "vaccines"}` : "",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        . {draft.source}
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
            {newResults.length === 0 ? <p className="mt-3 text-sm text-body">No new results.</p> : null}
            <ul className="mt-3 divide-y divide-line">
              {newResults.slice(0, 5).map((order) => {
                const { patient } = order;
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
