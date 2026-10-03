import { CircleCheck, TriangleAlert } from "lucide-react";

/** The error or notice a sign-in step comes back with. */
export function FormMessage({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
        <TriangleAlert aria-hidden className="size-4 shrink-0" />
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
        <CircleCheck aria-hidden className="size-4 shrink-0" />
        {notice}
      </p>
    );
  }
  return null;
}
