import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";

import {
  BloodGroup,
  Card,
  Contacts,
  EmergencyBanner,
  Footnote,
  Identity,
} from "@/components/emergency/emergency-profile";
import { HelplineBar } from "@/components/emergency/helpline-bar";
import { clientIp, findEmergencyProfile, logScan } from "@/lib/emergency-db";

// Medical data read fresh on every scan: never prerendered or cached. The MongoDB driver needs Node.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Layer 1: what anyone who scans the QR sees, limited to the fields the member chose. */
export default async function EmergencyPage(props: PageProps<"/e/[code]">) {
  const code = (await props.params).code.toUpperCase();
  const found = await findEmergencyProfile(code);
  if (!found) notFound();

  // Logged after the response is sent: a slow or failed insert never holds up a responder.
  const requestHeaders = await headers();
  const scan = {
    qrLinkId: found.qrLinkId,
    memberId: found.memberId,
    ip: clientIp(requestHeaders),
    userAgent: requestHeaders.get("user-agent") ?? undefined,
  };
  after(async () => {
    try {
      await logScan(scan);
    } catch (error) {
      console.error("Could not log emergency scan", error);
    }
  });

  const { view } = found;
  const { firstName } = view.member;
  const hasDetails = Boolean(
    view.bloodGroup ||
      view.allergies ||
      view.conditions ||
      view.medicines ||
      view.emergencyContacts ||
      view.organDonor !== undefined ||
      view.insurance,
  );

  return (
    <>
      <EmergencyBanner title="Emergency profile">
        If {firstName} needs help, call an ambulance first, then their family.
      </EmergencyBanner>
      <Identity code={code} member={view.member} />

      {view.bloodGroup ? <BloodGroup bloodGroup={view.bloodGroup} /> : null}
      {view.allergies ? <Card label="Allergies">{view.allergies.join(", ")}</Card> : null}
      {view.conditions ? <Card label="Conditions">{view.conditions.join(", ")}</Card> : null}
      {view.medicines ? <Card label="Current medicines">{view.medicines.join("; ")}</Card> : null}
      {view.emergencyContacts ? <Contacts contacts={view.emergencyContacts} /> : null}
      {view.organDonor !== undefined ? (
        <Card label="Organ donor">{view.organDonor ? "Yes" : "No"}</Card>
      ) : null}
      {view.insurance ? (
        <Card label="Insurance">
          {view.insurance.provider}
          {view.insurance.policyNumber ? (
            <span className="block text-base font-medium text-body">
              Policy {view.insurance.policyNumber}
            </span>
          ) : null}
        </Card>
      ) : null}

      {hasDetails ? null : (
        <section className="rounded-2xl bg-card px-4 py-4 text-ink">
          {firstName} has not added medical details yet. Call the helplines below.
        </section>
      )}

      <HelplineBar />
      <Footnote />
    </>
  );
}
