"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type Variant = "bar" | "hero";

const fields: Record<Variant, string> = {
  bar: "peer h-10 w-full rounded-full border border-line-strong bg-card pl-10 pr-10 text-sm font-medium text-ink shadow-card transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-muted focus:border-brand focus:shadow-[0_0_0_4px_rgba(221,67,1,0.12)] focus:outline-none",
  // As the search on the app's Records header: white, on the dark header, with a deep shadow.
  hero: "h-13 w-full rounded-[1.125rem] border-0 bg-card pl-12 pr-4 font-medium text-ink shadow-[0_12px_30px_rgba(0,0,0,0.22)] placeholder:font-normal placeholder:text-muted focus:shadow-[0_12px_30px_rgba(0,0,0,0.22),0_0_0_4px_rgba(246,175,145,0.45)] focus:outline-none",
};

/**
 * The patient search. It goes to Patients, and keeps showing what was searched while Patients
 * lists the results. In the top bar on wide screens, where "/" jumps to it from anywhere; in
 * the Patients header on phones.
 */
export function PatientSearch({ variant = "bar" }: { variant?: Variant }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = pathname === "/patients" ? (params.get("q") ?? "") : "";
  const input = useRef<HTMLInputElement>(null);
  const bar = variant === "bar";

  useEffect(() => {
    if (!bar) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      input.current?.focus();
      input.current?.select();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bar]);

  return (
    <SearchForm variant={variant}>
      {/* Re-created when the search changes, so it shows the one Patients is listing. */}
      <input
        key={q}
        ref={input}
        type="search"
        name="q"
        defaultValue={q}
        aria-label="Search patients"
        aria-keyshortcuts={bar ? "/" : undefined}
        enterKeyHint="search"
        placeholder={bar ? "Search patients" : "Name or 12-digit member ID"}
        className={fields[variant]}
      />
      {bar ? (
        <kbd
          aria-hidden
          className="kbd pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 peer-focus:hidden peer-not-placeholder-shown:hidden"
        >
          /
        </kbd>
      ) : null}
    </SearchForm>
  );
}

function SearchForm({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <Form action="/patients" role="search" className={`relative min-w-0 flex-1 ${variant === "bar" ? "max-w-md" : ""}`}>
      <Search
        aria-hidden
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${variant === "bar" ? "left-3.5 size-4" : "left-4 size-5"}`}
      />
      {children}
    </Form>
  );
}

/** The same box before the address is known, so nothing moves when it is. */
export function PatientSearchFallback({ variant = "bar" }: { variant?: Variant }) {
  return (
    <SearchForm variant={variant}>
      <input type="search" name="q" aria-label="Search patients" placeholder="Search patients" className={fields[variant]} />
    </SearchForm>
  );
}
