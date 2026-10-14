import { CalendarDays, ChevronRight, FileSignature, FlaskConical, LockOpen, TriangleAlert, Video, type LucideIcon } from "lucide-react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { ConsultRow } from "@/components/consult-row";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { bleed, overHero, PulseLine } from "@/components/hero";
import { HeroButtons } from "@/components/hero-buttons";
import { MarkReviewedButton } from "@/components/mark-reviewed-button";
import { ProfileNudge } from "@/components/profile/profile-nudge";
import { RequestsCard } from "@/components/requests/requests-card";
import { Avatar, Card, Chip, EmptyState, flagTone, IconTile, PanelLink, Section } from "@/components/ui";
import { UpNext } from "@/components/up-next";
import {
  getAttentionFlags,
  getConsultRequests,
  getPrescriptions,
  getStartingSoon,
  getTestOrders,
  getTodayConsults,
  getTodayStats,
  waitingTitle,
} from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { formatLongDay, greeting } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: waitingTitle("Today", await getTodayConsults()) };
}

/** Phones: the browser's bars take the dark header's colour. */
export const viewport: Viewport = { themeColor: "#0b2129" };

/** Each count's tile, as the app's quick actions: a gradient, light to deep. */
const tileColors = {
  orange: "from-[#f48a5a] to-brand",
  green: "from-[#2db394] to-[#10806d]",
  amber: "from-[#f5b544] to-[#d08a0a]",
  ink: "from-[#4a7c88] to-ink",
};

export default async function TodayPage() {
  const doctor = await getCurrentDoctor();
  const [today, counts, flags, drafts, newResults, startingSoon, requests] = await Promise.all([
    getTodayConsults(),
    getTodayStats(),
    getAttentionFlags(),
    getPrescriptions("draft"),
    getTestOrders("result_back"),
    getStartingSoon(),
    getConsultRequests(),
  ]);
  const remaining = today.filter((c) => c.status !== "completed").length;
  const summary =
    today.length === 0
      ? "No consults booked for today"
      : remaining === 0
        ? "All of today’s consults are done"
        : `${remaining} ${remaining === 1 ? "consult" : "consults"} to go`;

  const stats: { label: string; value: number; hint: string; href: string; icon: LucideIcon; color: keyof typeof tileColors }[] = [
    { label: "Consults today", value: today.length, hint: `${remaining} still to go`, href: "/schedule", icon: Video, color: "orange" },
    {
      label: "Records open",
      value: counts.recordsOpen,
      hint: "Shared by OTP for 24 h",
      href: "/patients?access=active",
      icon: LockOpen,
      color: "green",
    },
    {
      label: "Drafts to sign",
      value: counts.drafts,
      hint: "Prescriptions to review",
      href: "/prescriptions?status=draft",
      icon: FileSignature,
      color: "amber",
    },
    {
      label: "New results",
      value: counts.newResults,
      hint: "Not yet reviewed",
      href: "/results?status=result_back",
      icon: FlaskConical,
      color: "ink",
    },
  ];
  const hasNext = today.some((c) => c.status !== "completed");

  return (
    <>
      {/* As the app's Home: who's signed in and the day, on the ink gradient. */}
      <header
        className={`hero-bg relative overflow-hidden rounded-b-[2rem] px-4 pb-18 pt-[calc(env(safe-area-inset-top)+0.875rem)] text-white sm:px-6 lg:rounded-3xl lg:px-8 lg:pb-20 lg:pt-8 print:hidden ${bleed}`}
      >
        <PulseLine className="-right-3 top-[calc(env(safe-area-inset-top)+3.5rem)] lg:right-8 lg:top-6" />
        <div className="relative flex items-center gap-3">
          <Link
            href="/profile"
            aria-label="Open your profile"
            className="shrink-0 rounded-full p-0.5 ring-[1.5px] ring-brand-light/55 transition-opacity active:opacity-70 lg:hidden"
          >
            <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="hero" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/70">{greeting()}</p>
            <h1 className="truncate font-display text-[1.75rem] font-bold leading-[2.125rem] tracking-[-0.01em] lg:text-[2rem] lg:leading-10">
              <span className="lg:hidden">{doctor.shortName}</span>
              <span className="hidden lg:inline">{doctor.name}</span>
            </h1>
          </div>
          <HeroButtons refresh />
        </div>
        <p className="relative mt-3 flex items-center gap-2 text-[13px] font-medium text-white/75 lg:mt-2 lg:text-sm">
          <CalendarDays aria-hidden className="size-4 shrink-0 text-brand-light" />
          <span className="truncate">
            {formatLongDay()} · {summary}
          </span>
        </p>
      </header>

      {/* The day's four counts on a card that rides over the bottom of the header. */}
      <ul className={`${overHero} grid grid-cols-4 rounded-3xl border border-line bg-card px-1 pb-3.5 pt-4 shadow-lifted lg:gap-1 lg:p-2.5 print:hidden`}>
        {stats.map(({ label, value, hint, href, icon: Icon, color }) => (
          <li key={label} className="min-w-0">
            <Link
              href={href}
              className="pressable group flex h-full flex-col items-center gap-2 rounded-2xl px-0.5 text-center lg:flex-row lg:gap-3.5 lg:p-3 lg:text-left lg:hover:bg-surface"
            >
              <span
                className={`relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.1875rem] bg-linear-to-br text-white lg:size-12 lg:rounded-2xl ${tileColors[color]}`}
              >
                {/* A soft highlight on the top left, like light on glass. */}
                <span aria-hidden className="absolute inset-0 bg-linear-to-br from-white/30 to-white/0 to-70%" />
                <Icon aria-hidden className="relative size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[1.375rem] font-bold leading-none tabular-nums tracking-[-0.02em] text-ink lg:text-[1.625rem]">
                  {value}
                </span>
                <span className="mt-1 block text-[11.5px] font-semibold leading-tight text-body lg:text-[13px]">{label}</span>
                <span className="mt-0.5 hidden truncate text-xs text-muted xl:block">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/*
        Phones: one column, in the order the doctor needs them. Wide screens: the day's consults on
        the left, everything waiting on the doctor on the right.
      */}
      <div className="mt-6 flex flex-col gap-7 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start xl:gap-6">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-6">
          <div className="order-1 empty:hidden lg:hidden">
            <ProfileNudge missing={doctor.missing} />
          </div>

          {hasNext ? (
            <Section title="Up next" className="rise-in order-2 [animation-delay:60ms]">
              <UpNext consults={today} soon={startingSoon.map((c) => c.id)} />
            </Section>
          ) : null}

          <Section
            id="consults"
            title="Today’s consults"
            count={today.length}
            action={<PanelLink href="/schedule">Full schedule</PanelLink>}
            className="rise-in order-4 [animation-delay:180ms]"
          >
            <Card flush>
              {today.length > 0 ? (
                <ul className="divide-y divide-line">
                  {today.map((consult) => (
                    <ConsultRow key={consult.id} consult={consult} />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Video} title="Nothing booked today">
                  When members book a video consult with you, it shows up here.
                </EmptyState>
              )}
            </Card>
          </Section>
        </div>

        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-6">
          {/* Hidden when there are none. On phones, right after the next consult so it isn't missed. */}
          <RequestsCard id="requests" requests={requests} className="rise-in order-3 scroll-mt-24 [animation-delay:120ms]" />

          <Section title="Needs a look" count={flags.length} className="rise-in order-5 [animation-delay:240ms]">
            <Card flush>
              {flags.length > 0 ? (
                <ul className="divide-y divide-line">
                  {flags.map((flag) => (
                    <li key={flag.patient.id}>
                      <Link
                        href={`/patients/${flag.patient.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface active:bg-surface sm:px-5"
                      >
                        <IconTile icon={TriangleAlert} tone={flag.tone} size="md" />
                        <span className="min-w-0 flex-1 text-[13px] leading-snug text-body">
                          <span className="block text-sm font-bold text-ink">{flag.patient.name}</span>
                          {flag.text}
                        </span>
                        <ChevronRight aria-hidden className="size-4.5 shrink-0 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-[13px] text-body sm:px-5">Out-of-range readings from records shared with you show up here.</p>
              )}
            </Card>
          </Section>

          <Section
            title="Prescriptions to sign"
            count={drafts.length}
            action={drafts.length > 5 ? <PanelLink href="/prescriptions?status=draft">All {drafts.length}</PanelLink> : undefined}
            className="rise-in order-6 [animation-delay:300ms]"
          >
            <Card flush>
              {drafts.length === 0 ? <p className="px-4 py-4 text-[13px] text-body sm:px-5">No drafts waiting.</p> : null}
              <ul className="divide-y divide-line empty:hidden">
                {drafts.slice(0, 5).map((draft) => {
                  const { patient } = draft;
                  return (
                    <li key={draft.id}>
                      <Link
                        href={`/prescriptions/${draft.id}`}
                        className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface active:bg-surface sm:px-5"
                      >
                        <Avatar initials={patient.initials} tone={patient.avatarTone} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{patient.name}</span>
                          <span className="block truncate text-xs text-body">
                            {[
                              draft.items.length ? `${draft.items.length} ${draft.items.length === 1 ? "item" : "items"}` : "",
                              draft.tests.length ? `${draft.tests.length} ${draft.tests.length === 1 ? "lab test" : "lab tests"}` : "",
                              draft.vaccineCount ? `${draft.vaccineCount} ${draft.vaccineCount === 1 ? "vaccine" : "vaccines"}` : "",
                            ]
                              .filter(Boolean)
                              .join(", ")}{" "}
                            · {draft.source}
                          </span>
                        </span>
                        <span className="text-[13px] font-bold text-brand">Review</span>
                        <ChevronRight aria-hidden className="-ml-1.5 size-4 text-brand" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </Section>

          <Section
            title="New results"
            count={newResults.length}
            action={<PanelLink href="/results">All results</PanelLink>}
            className="rise-in order-7 [animation-delay:300ms]"
          >
            <Card flush>
              {newResults.length === 0 ? <p className="px-4 py-4 text-[13px] text-body sm:px-5">No new results.</p> : null}
              <ul className="divide-y divide-line empty:hidden">
                {newResults.slice(0, 5).map((order) => {
                  const { patient } = order;
                  return (
                    <li key={order.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                      <IconTile icon={FlaskConical} tone={flagTone[order.result!.flag]} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-body">
                          <Link href={`/patients/${patient.id}`} className="text-sm font-bold text-ink hover:underline">
                            {patient.name}
                          </Link>
                          <span className="block">{order.test}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-bold tabular-nums text-ink">{order.result!.value}</span>
                          <Chip tone={flagTone[order.result!.flag]}>{order.result!.label}</Chip>
                          <MarkReviewedButton
                            orderId={order.id}
                            what={`${patient.firstName}’s ${order.test}`}
                            className="btn-sm ml-auto"
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </Section>
        </div>
      </div>
    </>
  );
}

