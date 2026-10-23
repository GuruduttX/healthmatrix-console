import Link from "next/link";

import { nav } from "../content";
import { Brand } from "../ui/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 max-lg:items-center max-lg:text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <Link href="/welcome" aria-label="HealthMatrix home">
            <Brand />
          </Link>
          <p className="mt-3 text-sm font-medium text-body">Connected care. Human at heart.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-body max-lg:justify-center">
          {nav.map(({ href, label }) => (
            <a key={href} href={href} className="transition-colors hover:text-brand-deep">
              {label}
            </a>
          ))}
          <Link href="/login" className="transition-colors hover:text-brand-deep">
            Sign in
          </Link>
          <Link href="/register" className="text-brand-deep">
            Join as a doctor
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-4 py-6 pb-28 text-xs font-medium text-muted max-sm:items-center max-sm:text-center sm:flex-row sm:justify-between sm:px-6 sm:pb-6 lg:px-8">
        <p>For registered medical practitioners in India.</p>
        <p>© {new Date().getFullYear()} HealthMatrix</p>
      </div>
    </footer>
  );
}
