import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">Page not found</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">There is nothing at this address</h1>
      <p className="mt-2 max-w-md text-body">
        The link may be old, or the patient or consult may have been removed.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-danger">
        Go to Today
      </Link>
    </main>
  );
}
