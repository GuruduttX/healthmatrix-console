import { Sparkles } from "lucide-react";

import { IconTile } from "@/components/ui";

/**
 * Questions about the record are answered by Ekaay, which isn't connected yet. Until it is,
 * this says so instead of offering a box that can't answer.
 */
export function AskRecord() {
  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border-[1.5px] border-dashed border-line-strong bg-surface px-5 py-8 text-center">
      <IconTile icon={Sparkles} size="md" look="solid" />
      <p className="mt-3 text-sm font-bold text-ink">Ekaay isn’t connected yet</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-body">
        Once it is, you can ask about this patient’s history here and see the record each answer
        came from.
      </p>
    </div>
  );
}
