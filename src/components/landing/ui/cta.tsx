import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import styles from "./cta.module.css";

/** The page's one main action: register. A light sweeps across it now and then. */
export function JoinLink({ children = "Join as a doctor", className = "" }: { children?: string; className?: string }) {
  return (
    <Link href="/register" className={`btn btn-primary btn-lg group ${styles.join} ${className}`}>
      <span className="relative">{children}</span>
      <ArrowRight aria-hidden className="relative size-4.5 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export function SignInLink({ children = "Sign in", className = "" }: { children?: string; className?: string }) {
  return (
    <Link href="/login" className={`btn btn-secondary btn-lg group ${className}`}>
      {children}
      <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
