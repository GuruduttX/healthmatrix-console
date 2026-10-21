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
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { SignOutForm } from "@/components/sign-out-form";
import { BackLink, StackBar } from "@/components/stack-bar";
import { SwitchList } from "@/components/switch-list";
import { Card, CardTitle, IconTile, Section } from "@/components/ui";
import { getSettings } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { GAP_LABELS, profilePercent } from "@/lib/profile-gaps";
import type { Tone } from "@/lib/types";

export const metadata: Metadata = { title: "Profile and settings" };

/** A pill on the identity card: glass set into the glass. */
const pill = "glass-flat inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-mid";

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
      <StackBar back={{ href: "/", label: "Today" }} title="Profile" revealId="doctor-name" />
      <BackLink href="/" label="Today" />

      {/*
        Who you are, on a pane of glass as the app's profile: the photo in a ring of white with the
        one orange on it (the way to change it), then the name and two pills. Centred on phones.
      */}
      <header className="glass-panel mt-2 rounded-2xl px-4 py-5 sm:px-6 lg:mt-0 lg:px-7 lg:py-6 print:hidden">
        <div className="flex flex-col items-center gap-x-6 gap-y-3 text-center lg:flex-row lg:text-left">
          <Link href="/profile/edit" aria-label="Change your photo" className="group relative shrink-0 rounded-full">
            <span className="block rounded-full bg-white/70 p-1 shadow-[0_1px_2px_rgba(30,50,70,0.06),0_6px_14px_rgba(30,50,70,0.1)]">
              <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="xl" className="lg:size-24" />
            </span>
            <span className="absolute bottom-1 right-1 inline-flex size-9 items-center justify-center rounded-full border-[2.5px] border-white bg-brand-deep text-white shadow-glow transition-transform group-active:scale-95">
              <Camera aria-hidden className="size-4" />
            </span>
          </Link>
          <div className="min-w-0">
            <h1
              id="doctor-name"
              className="font-display text-2xl font-semibold leading-8 tracking-[-0.015em] text-ink lg:text-[1.75rem] lg:leading-9"
            >
              {doctor.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-body">{[doctor.specialty, doctor.qualifications].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              <span className={pill}>
                <BadgeCheck aria-hidden className="size-3.5 text-success" />
                Reg. {doctor.registrationNumber}
              </span>
              {doctor.experienceYears != null ? (
                <span className={pill}>
                  <BriefcaseMedical aria-hidden className="size-3.5 text-brand-deep" />
                  {doctor.experienceYears} {doctor.experienceYears === 1 ? "year" : "years"} in practice
                </span>
              ) : null}
            </div>
          </div>
          <Link href="/profile/edit" className="btn btn-secondary btn-sm ml-auto hidden shrink-0 lg:inline-flex">
            <UserRoundPen aria-hidden className="size-4" />
            Edit profile
          </Link>
        </div>
      </header>

      <div className="mt-5 grid items-start gap-5 lg:mt-6 xl:grid-cols-2 xl:gap-6">
        <div className="flex min-w-0 flex-col gap-5 xl:gap-6">
          {saved ? <FormMessage notice="Your profile is saved." className="border border-white/85" /> : null}

          {doctor.missing.length ? (
            <Card>
              <div className="flex items-center justify-between gap-4">
                <CardTitle icon={CircleDashed} tile>
                  Complete your profile
                </CardTitle>
                <span className="font-display text-base font-semibold tabular-nums text-ink">{percent}%</span>
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
                      <CircleDashed aria-hidden className="size-4 shrink-0 text-brand-deep" />
                      Add {GAP_LABELS[gap].toLowerCase()}
                      <ChevronRight aria-hidden className="ml-auto size-4.5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
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
          {/* Its title inside the card, not above it, so the note under the title stays with the switches. */}
          <Card>
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
