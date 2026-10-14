import { cookies } from "next/headers";

import { ChromeProvider } from "@/components/chrome";
import { LiveUpdates } from "@/components/live-updates";
import { DraftOwner } from "@/components/record/draft-owner";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/toast";
import { TopBar } from "@/components/top-bar";
import { getNotifications, getOpenRequestCount } from "@/lib/console-data";
import { getCurrentDoctor } from "@/lib/doctor-view";
import { SIDEBAR_COOKIE } from "@/lib/session";

/**
 * Every console screen needs a signed-in doctor with a finished profile. Phones get the app's
 * layout: each screen brings its own header, and the tab bar floats along the bottom.
 */
export default async function ConsoleLayout({ children }: LayoutProps<"/">) {
  const doctor = await getCurrentDoctor();
  const [{ unread }, requests, cookieStore] = await Promise.all([getNotifications(), getOpenRequestCount(), cookies()]);
  const chrome = {
    doctor: {
      name: doctor.name,
      initials: doctor.initials,
      photoUrl: doctor.photoUrl,
      specialty: doctor.specialty,
      missing: doctor.missing,
    },
    unread,
    requests,
  };

  return (
    <LiveUpdates>
      <ChromeProvider value={chrome}>
        <ToastProvider>
          <div className="flex min-h-dvh">
            <Sidebar collapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"} />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar doctor={doctor} unread={unread} />
              {/* Phones: room at the bottom for the floating tab bar. */}
              <main className="mx-auto w-full max-w-340 flex-1 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-12 lg:pt-1 print:p-0">
                <DraftOwner id={doctor.id}>{children}</DraftOwner>
              </main>
              <MobileNav />
            </div>
          </div>
        </ToastProvider>
      </ChromeProvider>
    </LiveUpdates>
  );
}
