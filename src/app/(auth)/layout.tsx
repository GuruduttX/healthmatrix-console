import { FileSearch, KeyRound, Mic } from "lucide-react";
import Image from "next/image";

const points = [
  {
    icon: KeyRound,
    title: "Opened only with the patient’s OTP",
    text: "No OTP, no access. Every view is logged and expires on its own.",
  },
  {
    icon: FileSearch,
    title: "The whole story in the first minute",
    text: "One timeline, Ekaay’s summary and trend charts, ready before the consult.",
  },
  {
    icon: Mic,
    title: "Prescriptions from a voice note or photo",
    text: "Ekaay drafts, checks allergies and interactions, and you sign.",
  },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/logo-mark.png" alt="" width={40} height={36} priority />
          <span className="leading-none">
            <span className="block font-display text-2xl font-bold">HealthMatrix</span>
            <span className="mt-1 block text-sm font-medium text-white/60">Doctor console</span>
          </span>
        </div>

        <div>
          <p className="font-display text-4xl font-bold leading-tight">
            Your patient’s history, already open when the consult starts.
          </p>
          <ul className="mt-10 flex flex-col gap-6">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-light">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          A Cloudspital and Holden joint venture. Powered by Ekaay.AI.
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-6 py-10">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Image src="/logo-mark.png" alt="" width={32} height={29} priority />
          <span className="font-display text-xl font-bold text-ink">HealthMatrix</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
