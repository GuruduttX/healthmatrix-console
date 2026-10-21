import { Activity, HeartHandshake, Pill, ShieldCheck, TriangleAlert } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";

import {
  BloodGroup,
  Contacts,
  Detail,
  EmergencyBanner,
  Footnote,
  Identity,
  Items,
  NoDetails,
  Panel,
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
      <Identity code={code} member={view.member}>
        {view.bloodGroup ? <BloodGroup bloodGroup={view.bloodGroup} /> : null}
      </Identity>

      {/* Right under who this is, as on the app's responder preview: the first thing to do is call. */}
      <HelplineBar />

      {view.allergies || view.conditions || view.medicines ? (
        <Panel title="Medical">
          {view.allergies ? (
            <Detail icon={TriangleAlert} tone="danger" label="Allergies">
              <Items items={view.allergies} flag="danger" />
            </Detail>
          ) : null}
          {view.conditions ? (
            <Detail icon={Activity} tone="warning" label="Conditions">
              <Items items={view.conditions} flag="warning" />
            </Detail>
          ) : null}
          {view.medicines ? (
            <Detail icon={Pill} label="Current medicines">
              <Items items={view.medicines} />
            </Detail>
          ) : null}
        </Panel>
      ) : null}
      {view.emergencyContacts ? <Contacts contacts={view.emergencyContacts} /> : null}
      {view.organDonor !== undefined || view.insurance ? (
        <Panel title="Other details">
          {view.organDonor !== undefined ? (
            <Detail icon={HeartHandshake} label="Organ donor">
              {view.organDonor ? "Yes" : "No"}
            </Detail>
          ) : null}
          {view.insurance ? (
            <Detail icon={ShieldCheck} label="Insurance">
              {view.insurance.provider}
              {view.insurance.policyNumber ? (
                <span className="block text-base font-medium text-body">
                  Policy {view.insurance.policyNumber}
                </span>
              ) : null}
            </Detail>
          ) : null}
        </Panel>
      ) : null}

      {hasDetails ? null : <NoDetails firstName={firstName} />}

      <Footnote />
    </>
  );
}
