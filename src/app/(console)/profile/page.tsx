import { BadgeCheck, LogOut } from "lucide-react";
import type { Metadata } from "next";

import { SwitchList } from "@/components/switch-list";
import { Card, Chip } from "@/components/ui";
import { signOut } from "@/lib/auth-actions";
import { doctor } from "@/lib/data";

export const metadata: Metadata = { title: "Profile and settings" };

const alerts = [
  { id: "otp", label: "A patient shares their record", hint: "When an OTP you asked for is approved.", on: true },
  { id: "results", label: "A result comes back", hint: "For tests you ordered, as soon as the pod or lab uploads them.", on: true },
  { id: "starting", label: "A consult is about to start", hint: "Five minutes before, by SMS and in the console.", on: true },
  { id: "ekaay", label: "Ekaay notices a trend", hint: "For patients whose record is open to you.", on: false },
];

export default function ProfilePage() {
  const details = [
    { term: "Mobile number", value: doctor.phone },
    { term: "Registration", value: `${doctor.registrationNumber}, ${doctor.council}` },
    { term: "Qualifications", value: doctor.qualifications },
    { term: "Specialties", value: doctor.specialties.join(", ") },
    { term: "Languages", value: doctor.languages.join(", ") },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-ink">Profile and settings</h1>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden
              className="inline-flex size-16 items-center justify-center rounded-full bg-success text-xl font-bold text-white"
            >
              {doctor.initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-ink">{doctor.name}</h2>
              <p className="text-sm text-body">{doctor.specialty}</p>
            </div>
            <Chip tone="success" icon={BadgeCheck}>
              Registration verified
            </Chip>
          </div>
          <dl className="mt-5 divide-y divide-line border-t border-line">
            {details.map((row) => (
              <div key={row.term} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 text-sm">
                <dt className="font-semibold text-body">{row.term}</dt>
                <dd className="text-right font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-body">
            Patients see your name, qualifications and specialties before they share a record. To
            change verified details, write to the HealthMatrix team.
          </p>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <h2 className="text-sm font-bold text-ink">Tell me when</h2>
            <SwitchList items={alerts} />
          </Card>

          <Card>
            <h2 className="text-sm font-bold text-ink">This session</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              Signed in on this browser with {doctor.phone}. Signing out does not close records that
              patients have shared; those expire on their own.
            </p>
            <form action={signOut} className="mt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger-soft"
              >
                <LogOut aria-hidden className="size-4" />
                Sign out
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
