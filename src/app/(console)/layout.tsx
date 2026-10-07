import { HideOnFocusScreens } from "@/components/mobile-chrome";
import { DraftOwner } from "@/components/record/draft-owner";
import { ProfileNudge } from "@/components/profile/profile-nudge";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { getNotifications } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";

/** Every console screen needs a signed-in doctor with a finished profile. */
export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const doctor = await getCurrentDoctor();
  const { unread } = await getNotifications();

  return (
    <div className="flex min-h-dvh">
      <Sidebar doctor={doctor} />
      <div className="flex min-w-0 flex-1 flex-col">
        <HideOnFocusScreens>
          <TopBar doctor={doctor} unread={unread} />
        </HideOnFocusScreens>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:py-6 print:pb-0">
          <ProfileNudge missing={doctor.missing} />
          <DraftOwner id={doctor.id}>{children}</DraftOwner>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
