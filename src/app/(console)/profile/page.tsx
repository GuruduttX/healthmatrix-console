import { ChevronRight, CircleCheck, LogOut, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FormMessage } from "@/components/auth/form-message";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { SignOutForm } from "@/components/sign-out-form";
import { SwitchList } from "@/components/switch-list";
import { Card } from "@/components/ui";
import { getSettings } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { GAP_LABELS, profilePercent } from "@/lib/profile-gaps";

export const metadata: Metadata = { title: "Profile and settings" };

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

  return (
    <>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Profile and settings</h1>
      {saved ? <FormMessage notice="Your profile is saved." /> : null}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <div className="relative flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left">
            <DoctorAvatar photoUrl={doctor.photoUrl} initials={doctor.initials} size="xl" className="sm:size-16 sm:text-xl" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-ink">{doctor.name}</h2>
              <p className="text-sm text-body">
                {[doctor.specialty, doctor.qualifications].filter(Boolean).join(" · ")}
              </p>
            </div>
            <Link
              href="/profile/edit"
              aria-label="Edit profile"
              title="Edit profile"
              className="absolute -right-1 -top-1 inline-flex size-10 items-center justify-center rounded-full border border-line bg-card text-ink hover:bg-selected sm:static"
            >
              <Pencil aria-hidden className="size-4" />
            </Link>
          </div>

          {doctor.about ? (
            <p className="mt-5 whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink">
              {doctor.about}
            </p>
          ) : null}

          <dl className="mt-5 divide-y divide-line border-t border-line">
            {details.map((row) => (
              <div key={row.term} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 text-sm">
                <dt className="font-semibold text-body">{row.term}</dt>
                <dd className="text-right font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/profile/edit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-ink-mid sm:hidden"
          >
            <Pencil aria-hidden className="size-4" />
            Edit profile
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-body">
            Patients see your photo, name, qualifications and specialties before they share a record.
            To change your registration details, write to the HealthMatrix team.
          </p>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          {doctor.missing.length ? (
            <Card highlight>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-bold text-ink">Complete your profile</h2>
                <span className="text-sm font-bold text-brand">{profilePercent(doctor.missing)}%</span>
              </div>
              <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-brand" style={{ width: `${profilePercent(doctor.missing)}%` }} />
              </div>
              <p className="mt-3 text-xs text-body">A complete profile helps patients trust who they are sharing with.</p>
              <ul className="mt-2">
                {doctor.missing.map((gap) => (
                  <li key={gap}>
                    <Link
                      href="/profile/edit"
                      className="flex items-center gap-3 rounded-lg py-2 text-sm font-semibold text-ink hover:text-brand"
                    >
                      <CircleCheck aria-hidden className="size-4 text-brand-light" />
                      Add {GAP_LABELS[gap].toLowerCase()}
                      <ChevronRight aria-hidden className="ml-auto size-4 text-body" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-sm font-bold text-ink">Tell me when</h2>
            <p className="mt-1 text-xs text-body">Shown in Notifications. Turning one off hides those notifications.</p>
            <SwitchList group="alerts" items={alerts} />
          </Card>

          <Card>
            <h2 className="text-sm font-bold text-ink">This session</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Signed in on this browser with {doctor.phone}. Signing out does not close records that
              patients have shared; those expire on their own.
            </p>
            <SignOutForm className="mt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger-soft"
              >
                <LogOut aria-hidden className="size-4" />
                Sign out
              </button>
            </SignOutForm>
          </Card>
        </div>
      </div>
    </>
  );
}
