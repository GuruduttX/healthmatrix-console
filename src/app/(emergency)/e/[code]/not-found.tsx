import { EmergencyBanner } from "@/components/emergency/emergency-profile";
import { HelplineBar } from "@/components/emergency/helpline-bar";

/** Unknown and revoked codes look the same, so nobody learns whether a code ever existed. */
export default function EmergencyCodeNotFound() {
  return (
    <>
      <EmergencyBanner title="This code is not active">
        The card may have been replaced or reported lost. If someone needs help, call now.
      </EmergencyBanner>
      <HelplineBar />
    </>
  );
}
