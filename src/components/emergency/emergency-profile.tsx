import { Phone } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar } from "@/components/ui";
import { type EmergencyProfileView, telHref } from "@/lib/emergency";

/**
 * Server-rendered pieces of the public emergency page. No client components:
 * the page must read and dial with JavaScript off. Every section here is only
 * rendered when it has data; an empty field is hidden, never shown as "none".
 */

const genderLabels: Record<NonNullable<EmergencyProfileView["member"]["gender"]>, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

export function EmergencyBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="rounded-2xl bg-brand px-4 py-4 text-white">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 leading-snug">{children}</p>
    </header>
  );
}

export function Identity({ code, member }: { code: string; member: EmergencyProfileView["member"] }) {
  const about = [
    member.gender ? genderLabels[member.gender] : null,
    member.age === undefined ? null : `${member.age} years`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-3 py-1">
      {member.hasPhoto ? (
        // Served by `/e/<code>/photo`, which checks the member still shows it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/e/${encodeURIComponent(code)}/photo`}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full bg-ink-mid object-cover"
        />
      ) : (
        <Avatar initials={member.initials} tone="ink" size="lg" />
      )}
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-ink">{member.name}</p>
        {about ? <p className="mt-0.5 text-body">{about}</p> : null}
      </div>
    </div>
  );
}

export function BloodGroup({ bloodGroup }: { bloodGroup: string }) {
  return (
    <section className="rounded-2xl border border-brand-light bg-danger-soft px-4 py-3">
      <h2 className="text-sm font-semibold text-danger">Blood group</h2>
      <p className="mt-1 text-5xl font-bold leading-none text-brand">{bloodGroup}</p>
    </section>
  );
}

export function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card px-4 py-3">
      <h2 className="text-sm font-semibold text-body">{label}</h2>
      <div className="mt-1 text-lg font-bold leading-snug text-ink">{children}</div>
    </section>
  );
}

export function Contacts({
  contacts,
}: {
  contacts: NonNullable<EmergencyProfileView["emergencyContacts"]>;
}) {
  return (
    <section className="rounded-2xl bg-card">
      <h2 className="px-4 pt-3 text-sm font-semibold text-body">Emergency contacts</h2>
      <ul className="divide-y divide-line">
        {contacts.map((contact, index) => (
          <li key={`${index}-${contact.phone}`} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-snug text-ink">{contact.name}</p>
              {contact.relation ? <p className="text-body">{contact.relation}</p> : null}
            </div>
            <a
              href={telHref(contact.phone)}
              aria-label={`Call ${contact.name}`}
              className="inline-flex min-h-12 min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 font-bold text-white hover:bg-danger"
            >
              <Phone aria-hidden className="size-4" />
              Call
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footnote() {
  return (
    <footer className="flex flex-col gap-1 px-1 pt-2 text-center text-sm text-body">
      <p>Doctors can request full records with the member’s OTP.</p>
      <p className="font-semibold">HealthMatrix</p>
    </footer>
  );
}
