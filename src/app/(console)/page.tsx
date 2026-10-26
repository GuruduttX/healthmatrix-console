import { ArrowUpRight, ChevronRight, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ConsultRow } from "@/components/consult-row";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { DuoCalendar, DuoFlask, DuoPulse } from "@/components/duo-icons";
import { BrandIcon, GlassDish } from "@/components/glass";
import { ConsultGlyph, RecordOpenGlyph, ResultGlyph, SignGlyph, type GlassGlyph } from "@/components/glass-glyphs";
import { HeroButtons } from "@/components/hero-buttons";
import { MarkReviewedButton } from "@/components/mark-reviewed-button";
import { ProfileNudge } from "@/components/profile/profile-nudge";
import { RequestsCard } from "@/components/requests/requests-card";
import { Avatar, Card, Chip, EmptyState, flagTone, PanelLink, Section } from "@/components/ui";
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

/** Rows inside a glass card: a faint line between them, and links lit on hover. */
const rows = "divide-y divide-line";
const rowLink = "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/60 active:bg-white/60 sm:px-5";

/**
 * Wide screens: how much of the day's list is done, as a ring like the app's doses ring: brand
 * orange on a see-through grey track, so the track takes the glass's tint.
 */
function DayProgress({ done, total }: { done: number; total: number }) {
  const radius = 23;
  const length = 2 * Math.PI * radius;
  return (
    <div className="glass-panel hidden shrink-0 items-center gap-4 rounded-2xl py-3 pl-3 pr-6 lg:flex">
      <span className="relative inline-flex size-14 items-center justify-center">
        <svg viewBox="0 0 56 56" aria-hidden className="absolute inset-0 -rotate-90">
          <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="5" className="stroke-[rgba(40,64,84,0.1)]" />
          {done > 0 ? (
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-brand"
              strokeDasharray={length}
              strokeDashoffset={length * (1 - done / total)}
            />
          ) : null}
        </svg>
        <span className="font-display text-xs font-semibold tabular-nums text-ink">{Math.round((done / total) * 100)}%</span>
      </span>
      <span>
        <span className="block text-xs font-semibold text-muted">Today so far</span>
        <span className="mt-0.5 block font-display text-lg font-semibold leading-6 tabular-nums text-ink">
          {done} of {total} done
        </span>
      </span>
    </div>
  );
}

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
  // A missed consult is past: it isn't still to go, and it isn't done either.
  const remaining = today.filter((c) => c.status !== "completed" && !c.missed).length;
  const missed = today.filter((c) => c.missed).length;
  const summary =
    today.length === 0
      ? "No consults booked for today"
      : remaining === 0
        ? "All of today’s consults are done"
        : `${remaining} ${remaining === 1 ? "consult" : "consults"} to go`;

  const stats: { label: string; value: number; hint: string; href: string; glyph: GlassGlyph }[] = [
    { label: "Consults today", value: today.length, hint: `${remaining} still to go`, href: "/schedule", glyph: ConsultGlyph },
    {
      label: "Records open",
      value: counts.recordsOpen,
      hint: "Shared by OTP for 24 h",
      href: "/patients?access=active",
      glyph: RecordOpenGlyph,
    },
    {
      label: "Drafts to sign",
      value: counts.drafts,
      hint: "Prescriptions to review",
      href: "/prescriptions?status=draft",
      glyph: SignGlyph,
    },
    {
      label: "New results",
      value: counts.newResults,
      hint: "Not yet reviewed",
      href: "/results?status=result_back",
      glyph: ResultGlyph,
    },
  ];
  const hasNext = remaining > 0;

  return (
    <>
      {/* Who's signed in and the day, straight on the page with the light behind, as the app's Home. */}
      <header className="relative pt-[calc(env(safe-area-inset-top)+0.875rem)] lg:flex lg:items-end lg:justify-between lg:gap-6 lg:pt-5 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              aria-label="Open your profile"
              className="medallion shrink-0 transition-opacity active:opacity-70 lg:hidden"
            >
              <span className="block rounded-full bg-white p-0.5">
                <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="md" />
              </span>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-body">{greeting()}</p>
              <h1 className="truncate font-display text-[1.75rem] font-semibold leading-8.5 tracking-[-0.015em] text-ink lg:text-[2.5rem] lg:leading-12">
                <span className="lg:hidden">{doctor.shortName}</span>
                <span className="hidden lg:inline">{doctor.name}</span>
              </h1>
            </div>
            <HeroButtons refresh />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <span className="glass-pill">
              <DuoCalendar className="size-4 text-brand-deep" />
              {formatLongDay()}
            </span>
            <span className="glass-pill">
              <span aria-hidden className={`size-2 rounded-full ${remaining ? "bg-brand" : "bg-success"}`} />
              {summary}
            </span>
          </div>
        </div>
        {today.length > missed ? <DayProgress done={today.length - missed - remaining} total={today.length - missed} /> : null}
      </header>

      {/*
        The day's four counts, each a glass glyph in a round of glass as on the app's quick actions:
        on phones one pane with a hairline between each, like the app's vitals; a pane each on wide screens.
      */}
      <ul className="mt-5 grid grid-cols-4 max-lg:glass-panel max-lg:divide-x max-lg:divide-line max-lg:rounded-2xl max-lg:px-1 max-lg:py-3.5 lg:mt-7 lg:gap-4 print:hidden">
        {stats.map(({ label, value, hint, href, glyph: Glyph }) => (
          <li key={label} className="relative min-w-0 lg:glass-panel lg:rounded-2xl">
            <Link
              href={href}
              className="pressable group relative flex h-full flex-col items-center gap-2 rounded-2xl px-0.5 text-center lg:items-start lg:gap-4 lg:p-5 lg:text-left"
            >
              <GlassDish>
                <Glyph />
              </GlassDish>
              <span className="min-w-0">
                <span className="block font-display text-[1.375rem] font-semibold leading-none tabular-nums tracking-[-0.02em] text-ink lg:text-[2.125rem]">
                  {value}
                </span>
                <span className="mt-1 block text-[11.5px] font-semibold leading-tight text-body lg:mt-1.5 lg:text-sm lg:text-ink">
                  {label}
                </span>
                <span className="mt-0.5 hidden truncate text-xs text-muted lg:block">{hint}</span>
              </span>
              <span
                aria-hidden
                className="btn-frost absolute right-4 top-4 hidden size-8 items-center justify-center rounded-full text-muted transition-colors group-hover:text-brand-deep lg:inline-flex"
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/*
        Phones: one column, in the order the doctor needs them. Wide screens: the day's consults on
        the left, everything waiting on the doctor on the right.
      */}
      <div className="mt-7 flex flex-col gap-7 xl:mt-8 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start xl:gap-6">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-7">
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
                <ul className={rows}>
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

        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-7">
          {/* Hidden when there are none. On phones, right after the next consult so it isn't missed. */}
          <RequestsCard id="requests" requests={requests} className="rise-in order-3 scroll-mt-24 [animation-delay:120ms]" />

          <Section
            title="Needs a look"
            count={flags.length}
            className="rise-in order-5 [animation-delay:240ms]"
          >
            <Card flush>
              {flags.length > 0 ? (
                <ul className={rows}>
                  {flags.map((flag) => (
                    <li key={flag.patient.id}>
                      <Link href={`/patients/${flag.patient.id}`} className={rowLink}>
                        <BrandIcon icon={DuoPulse} size="md" status={flag.tone} />
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
              <ul className={`${rows} empty:hidden`}>
                {drafts.slice(0, 5).map((draft) => {
                  const { patient } = draft;
                  return (
                    <li key={draft.id}>
                      <Link href={`/prescriptions/${draft.id}`} className={`group ${rowLink}`}>
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
                        <span className="text-[13px] font-bold text-brand-deep">Review</span>
                        <ChevronRight aria-hidden className="-ml-1.5 size-4 text-brand-deep" />
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
              <ul className={`${rows} empty:hidden`}>
                {newResults.slice(0, 5).map((order) => {
                  const { patient } = order;
                  return (
                    <li key={order.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                      <BrandIcon icon={DuoFlask} size="md" status={flagTone[order.result!.flag]} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-body">
                          <Link href={`/patients/${patient.id}`} className="text-sm font-bold text-ink hover:underline">
                            {patient.name}
                          </Link>
                          <span className="block">{order.test}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-semibold tabular-nums text-ink">{order.result!.value}</span>
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
