import { Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
      <Image src="/logo-mark.png" alt="" width={32} height={29} className="mb-8" />
      {/* The app's empty-state look: the icon in a round of glass on a soft halo. */}
      <span aria-hidden className="inline-flex size-19 items-center justify-center rounded-full bg-selected text-ink-mid">
        <span className="glass-small inline-flex size-13.5 items-center justify-center rounded-full">
          <Compass className="size-6" />
        </span>
      </span>
      <p className="mt-5 text-[13px] font-bold text-brand-deep">Page not found</p>
      <h1 className="mt-1 font-display text-[1.6875rem] font-semibold leading-tight tracking-[-0.015em] text-ink">
        There is nothing at this address
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-body">
        The link may be old, or the patient or consult may have been removed.
      </p>
      <Link href="/" className="btn btn-primary mt-7 w-full max-w-xs">
        Go to Today
      </Link>
    </main>
  );
}
