import {
  BadgeCheck,
  Bell,
  BriefcaseMedical,
  Camera,
  ChevronRight,
  CircleDashed,
  History,
  LogOut,
  ShieldCheck,
  UserRoundPen,
  type LucideIcon,
} from "lucide-react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { bleed } from "@/components/hero";
import { SignOutForm } from "@/components/sign-out-form";
import { BackLink, StackBar } from "@/components/stack-bar";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle, IconTile, Section } from "@/components/ui";
import { getSettings } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { GAP_LABELS, profilePercent } from "@/lib/profile-gaps";
import type { Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Profile and settings" };

/** Phones: the browser's bars take the dark header's colour. */
export const viewport: Viewport = { themeColor: "#0b2129" };

/** A row in a settings list, as in a phone's Settings app. */
function SettingsRow({
  icon,
  tone = "neutral",
  label,
  hint,
  trailing,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: ReactNode;
  hint?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <span className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <IconTile icon={icon} tone={tone} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint ? <span className="block text-[13px] text-body">{hint}</span> : null}
      </span>
      {trailing ?? <ChevronRight aria-hidden className="size-4.5 shrink-0 text-muted" />}
    </span>
  );
}

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const [doctor, settings, { saved }] = await Promise.all([getCurrentDoctor(), getSettings(), searchParams]);
  const alerts = [
    { id: "otp", label: "A patient shares their record", hint: "When an OTP you asked for is approved, or is still waiting.", on: settings.alerts.otp },
    { id: "bookings", label: "A patient books or cancels", hint: "Each new booking and each cancellation by a patient.", on: settings.alerts.bookings },
    { id: "starting", label: "A consult is about to start", hint: "Ten minutes before, in the console.", on: settings.alerts.starting },
    { id: "results", label: "A result comes back", hint: "For tests you ordered, as soon as the pod or lab uploads them.", on: settings.alerts.results },
    { id: "ekaay", label: "Ekaay notices a trend", hint: "For patients whose record is open to you.", on: settings.alerts.ekaay, soon: true },
  ];
  const details = [
    { term: "Mobile number", value: doctor.phone },
    { term: "Registration", value: [doctor.registrationNumber, doctor.council].filter(Boolean).join(", ") },
    { term: "Qualifications", value: doctor.qualifications || "Not added yet" },
    {
      term: "Experience",
      value:
        doctor.experienceYears == null
          ? "Not added yet"
          : `${doctor.experienceYears} ${doctor.experienceYears === 1 ? "year" : "years"}`,
    },
    { term: "Specialties", value: doctor.specialties.join(", ") },
    { term: "Languages", value: doctor.languages.join(", ") },
    { term: "Location", value: doctor.location },
  ];
  const percent = profilePercent(doctor.missing);

  return (
    <>
      <StackBar tone="dark" back={{ href: "/", label: "Today" }} title="Profile" revealId="doctor-name" />
      <BackLink href="/" label="Today" />

      {/* Who you are, on the same dark header as the app's profile. */}
      <header
        className={`hero-bg relative overflow-hidden rounded-b-[2rem] px-4 pb-14 pt-[calc(env(safe-area-inset-top)+3.75rem)] text-white sm:px-6 lg:rounded-3xl lg:px-8 lg:pb-16 lg:pt-8 print:hidden ${bleed}`}
      >
        <div className="relative flex flex-col items-center gap-x-6 gap-y-1 text-center lg:flex-row lg:text-left">
          <Link href="/profile/edit" aria-label="Change your photo" className="group relative shrink-0 rounded-full bg-white/14 p-1">
            <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="xl" className="lg:size-24" />
            <span className="absolute bottom-1 right-1 inline-flex size-9 items-center justify-center rounded-full border-[3px] border-ink bg-brand transition-transform group-active:scale-95">
              <Camera aria-hidden className="size-4" />
            </span>
          </Link>
          <div className="mt-2.5 min-w-0 lg:mt-0">
            <h1 id="doctor-name" className="font-display text-2xl font-bold leading-8 tracking-[-0.01em] lg:text-[1.75rem] lg:leading-9">
              {doctor.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-white/70">{[doctor.specialty, doctor.qualifications].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[#7fd6c2]">
                <BadgeCheck aria-hidden className="size-3.5" />
                Reg. {doctor.registrationNumber}
              </span>
              {doctor.experienceYears != null ? (
                <span className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-brand-light">
                  <BriefcaseMedical aria-hidden className="size-3.5" />
                  {doctor.experienceYears} {doctor.experienceYears === 1 ? "year" : "years"} in practice
                </span>
              ) : null}
            </div>
          </div>
          <Link href="/profile/edit" className="btn btn-light btn-sm ml-auto hidden shrink-0 lg:inline-flex">
            <UserRoundPen aria-hidden className="size-4" />
            Edit profile
          </Link>
        </div>
      </header>

      {/* The cards ride up over the bottom of the header, as in the app. */}
      <div className="relative z-10 -mt-9 grid items-start gap-5 lg:-mt-10 xl:grid-cols-2 xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5 xl:gap-6">
          {saved ? <FormMessage notice="Your profile is saved." className="rounded-2xl shadow-card" /> : null}

          {doctor.missing.length ? (
            <Card className="shadow-lifted">
              <div className="flex items-center justify-between gap-4">
                <CardTitle icon={CircleDashed} tile>
                  Complete your profile
                </CardTitle>
                <span className="font-display text-base font-bold tabular-nums text-ink">{percent}%</span>
              </div>
              <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-full bg-selected">
                <div className="h-full rounded-full bg-linear-to-r from-brand-mid to-brand" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2.5 text-[13px] text-body">A complete profile helps patients trust who they are sharing with.</p>
              <ul className="-mx-2 mt-2">
                {doctor.missing.map((gap) => (
                  <li key={gap}>
                    <Link
                      href="/profile/edit"
                      className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface active:bg-surface"
                    >
                      <CircleDashed aria-hidden className="size-4 shrink-0 text-brand" />
                      Add {GAP_LABELS[gap].toLowerCase()}
                      <ChevronRight aria-hidden className="ml-auto size-4.5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className={doctor.missing.length ? "" : "shadow-lifted"}>
            <CardTitle>About you</CardTitle>
            {doctor.about ? (
              <p className="mt-3 whitespace-pre-line rounded-2xl bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink">{doctor.about}</p>
            ) : null}
            <dl className="mt-3 divide-y divide-line">
              {details.map((row) => (
                <div key={row.term} className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 py-3 text-[13px]">
                  <dt className="text-muted">{row.term}</dt>
                  <dd className="text-right font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/profile/edit" className="btn btn-primary mt-3 w-full lg:hidden">
              <UserRoundPen aria-hidden className="size-4.5" />
              Edit profile
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Patients see your photo, name, qualifications and specialties before they share a record.
              To change your registration details, write to the HealthMatrix team.
            </p>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-7 xl:gap-6">
          {/* A card, not a titled section: on wide screens it rides up over the header too. */}
          <Card className="xl:shadow-lifted">
            <CardTitle icon={Bell} tile>
              Tell me when
            </CardTitle>
            <p className="mt-1.5 text-[13px] text-body">Shown in Notifications. Turning one off hides those notifications.</p>
            <SwitchList group="alerts" items={alerts} />
          </Card>

          <Section title="Account">
            <Card flush>
              <ul className="divide-y divide-line text-ink">
                <li>
                  <Link href="/profile/edit" className="block transition-colors hover:bg-surface active:bg-surface">
                    <SettingsRow
                      icon={UserRoundPen}
                      tone="brand"
                      label="Edit profile"
                      hint={doctor.missing.length ? `${doctor.missing.length} to add` : "Photo, training and practice"}
                    />
                  </Link>
                </li>
                <li>
                  <Link href="/access-log" className="block transition-colors hover:bg-surface active:bg-surface">
                    <SettingsRow icon={History} label="Access log" hint="Every record you asked for or opened" />
                  </Link>
                </li>
                <li>
                  <SignOutForm>
                    <button type="submit" className="block w-full text-left text-danger transition-colors hover:bg-danger-soft/60 active:bg-danger-soft/60">
                      <SettingsRow icon={LogOut} tone="danger" label="Sign out" hint={`Signed in with ${doctor.phone}`} trailing={<span />} />
                    </button>
                  </SignOutForm>
                </li>
              </ul>
            </Card>
            <p className="mt-3 flex items-start gap-1.5 px-1 text-xs leading-relaxed text-muted">
              <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" />
              Signing out does not close records that patients have shared; those expire on their own.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
}
