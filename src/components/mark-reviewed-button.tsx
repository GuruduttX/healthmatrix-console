"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";

import { useToast } from "@/components/toast";
import { markResultReviewed } from "@/lib/console-actions";

/** Takes a result off the "new" list, with a toast once it has gone. */
export function MarkReviewedButton({ orderId, what, className = "" }: { orderId: string; what: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function markReviewed() {
    startTransition(async () => {
      await markResultReviewed(orderId);
      toast(`Marked reviewed: ${what}`);
    });
  }

  return (
    <button
      type="button"
      onClick={markReviewed}
      disabled={pending}
      className={`btn btn-secondary ${className}`}
    >
      <Check aria-hidden className="size-3.5 text-muted" />
      {pending ? "Saving…" : "Mark reviewed"}
    </button>
  );
}
