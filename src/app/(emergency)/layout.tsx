import type { Metadata, Viewport } from "next";

/**
 * Public pages opened by scanning a member's emergency QR. No console chrome,
 * no sign-in, never indexed. See `proxy.ts` and the headers in `next.config.ts`.
 */
export const metadata: Metadata = {
  title: { absolute: "Emergency profile | HealthMatrix" },
  description: "Emergency details shared by a HealthMatrix member.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  themeColor: "#dd4301",
};

// Responders may be on a weak network: read in the phone's own font, never wait for a web font.
const systemFont = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function EmergencyLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-surface text-ink" style={{ fontFamily: systemFont }}>
      <main className="mx-auto flex w-full max-w-120 flex-col gap-3 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        {children}
      </main>
    </div>
  );
}
