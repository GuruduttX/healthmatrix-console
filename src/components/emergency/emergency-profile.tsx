import type { LucideIcon } from "lucide-react";
import { Droplet, Lock, Phone, PhoneCall, Siren, TriangleAlert, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, IconTile } from "@/components/ui";
import { type EmergencyProfileView, telHref } from "@/lib/emergency";
import type { Tone } from "@/lib/types";

/**
 * Server-rendered pieces of the public emergency page. No client components:
 * the page must read and dial with JavaScript off. Every section here is only
 * rendered when it has data; an empty field is hidden, never shown as "none".
 * The look is the app's responder preview: panes of glass on the lit page, with
 * crimson kept for what a responder must not miss.
 */

const genderLabels: Record<NonNullable<EmergencyProfileView["member"]["gender"]>, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
};

/** The page's title and what to do first, straight on the page. */
export function EmergencyBanner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="px-1 pb-1 pt-3 text-center">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
      <p className="mx-auto mt-1 max-w-sm text-[15px] font-medium leading-snug text-body">{children}</p>
    </header>
  );
}

/** Who this is, on the page's first pane. `children`: the blood group, under a rule. */
export function Identity({
  code,
  member,
  children,
}: {
  code: string;
  member: EmergencyProfileView["member"];
  children?: ReactNode;
}) {
  const about = [
    member.gender ? genderLabels[member.gender] : null,
    member.age === undefined ? null : `${member.age} years`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section aria-label="Who this is" className="glass-panel flex flex-col items-center rounded-2xl px-4 pb-4.5 pt-4 text-center">
      {/*
        A faint crimson light from the top: an emergency page, without a red header. Behind the
        rim and the text (the pane is its own stacking context, so it stays inside it).
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(rgba(251,228,234,0.85),rgba(251,228,234,0)_60%)]"
      />
      <p className="inline-flex items-center gap-1 rounded-full bg-danger-soft py-0.5 pl-2 pr-2.5 text-[11px] font-bold uppercase leading-4 tracking-[0.06em] text-danger">
        <Siren aria-hidden className="size-3" />
        Medical ID
      </p>
      {/* A ring of glass around the photo. */}
      <span className="glass-flat mt-3 flex rounded-full p-1">
        {member.hasPhoto ? (
          // Served by `/e/<code>/photo`, which checks the member still shows it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/e/${encodeURIComponent(code)}/photo`}
            alt=""
            width={72}
            height={72}
            className="block size-18 rounded-full bg-selected object-cover"
          />
        ) : (
          <Avatar initials={member.initials} tone="ink" size="xl" />
        )}
      </span>
      <p className="mt-2.5 text-[1.625rem] font-semibold leading-8 tracking-[-0.02em] text-ink">{member.name}</p>
      {about ? <p className="text-sm font-medium text-body">{about}</p> : null}
      {children}
    </section>
  );
}

/** In the identity pane, under a rule that runs to its edges: big and crimson, read at a glance. */
export function BloodGroup({ bloodGroup }: { bloodGroup: string }) {
  return (
    <div className="-mx-4 mt-3.5 self-stretch border-t border-line px-4 pt-3">
      <h2 className="inline-flex items-center gap-1 text-[13px] font-semibold text-body">
        <Droplet aria-hidden className="size-3.5 text-danger" />
        Blood group
      </h2>
      <p className="mt-1 text-4xl font-semibold leading-none tracking-[-0.02em] text-danger">{bloodGroup}</p>
    </div>
  );
}

/** A titled pane of rows, as the app's list cards, with a hairline between rows. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[15px] font-semibold text-ink">{title}</h2>
      <ul className="glass-panel divide-y divide-line rounded-2xl">{children}</ul>
    </section>
  );
}

/** A row on a panel: an icon in a round of glass, a quiet label, and what it says under it. */
export function Detail({
  icon,
  tone,
  label,
  children,
}: {
  icon: LucideIcon;
  /** A flag's colour for the icon's dish, for rows a responder must not miss. */
  tone?: Tone;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <IconTile icon={icon} size="md" tone={tone} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold text-muted">{label}</h3>
        <div className="mt-0.5 text-lg font-bold leading-snug text-ink">{children}</div>
      </div>
    </li>
  );
}

const itemLooks = {
  /** Glass set into the pane. */
  plain: "glass-flat px-3 text-ink",
  /** Allergies: crimson, with a warning sign. */
  danger: "border border-white/85 bg-danger-soft pl-2.5 pr-3 text-danger",
  /** Conditions: amber. */
  warning: "border border-white/85 bg-warning-soft px-3 text-warning",
};

/** One detail's items as pills. The tints are see-through, so they take the pane's light too. */
export function Items({ items, flag = "plain" }: { items: string[]; flag?: keyof typeof itemLooks }) {
  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className={`inline-flex max-w-full items-center gap-1 rounded-full py-1 text-[15px] font-bold leading-5 ${itemLooks[flag]}`}
        >
          {flag === "danger" ? <TriangleAlert aria-hidden className="size-3.5 shrink-0" /> : null}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Contacts({
  contacts,
}: {
  contacts: NonNullable<EmergencyProfileView["emergencyContacts"]>;
}) {
  return (
    <Panel title="Emergency contacts">
      {contacts.map((contact, index) => (
        <li key={`${index}-${contact.phone}`} className="flex items-center gap-3 px-4 py-3">
          <IconTile icon={UserRound} size="md" tone="neutral" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug text-ink">{contact.name}</p>
            {contact.relation ? <p className="text-body">{contact.relation}</p> : null}
          </div>
          <a href={telHref(contact.phone)} aria-label={`Call ${contact.name}`} className="btn btn-primary shrink-0">
            <Phone aria-hidden className="size-4" />
            Call
          </a>
        </li>
      ))}
    </Panel>
  );
}

/** When the member shows nothing beyond who they are. */
export function NoDetails({ firstName }: { firstName: string }) {
  return (
    <section className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-4">
      <IconTile icon={PhoneCall} size="md" />
      <p className="text-[15px] font-medium leading-snug text-ink">
        {firstName} has not added medical details yet. Call the helplines above.
      </p>
    </section>
  );
}

export function Footnote() {
  return (
    <footer className="flex flex-col items-center gap-1 px-1 pt-1 text-center text-[13px] text-muted">
      <p className="flex items-start gap-1.5">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Doctors can request full records with the member’s OTP.
      </p>
      <p className="font-semibold text-body">HealthMatrix</p>
    </footer>
  );
}
