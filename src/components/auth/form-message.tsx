import { CircleCheck, TriangleAlert } from "lucide-react";

const box = "flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[13px] font-semibold leading-5";

/** The error or notice a sign-in step comes back with. */
export function FormMessage({ error, notice, className = "mt-4" }: { error?: string; notice?: string; className?: string }) {
  if (error) {
    return (
      <p role="alert" className={`${box} bg-danger-soft text-danger ${className}`}>
        <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className={`${box} bg-success-soft text-success ${className}`}>
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        {notice}
      </p>
    );
  }
  return null;
}
