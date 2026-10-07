"use client";

import { useOptimistic, useTransition } from "react";

import { updateSetting } from "@/lib/console-actions";
import type { SettingGroup } from "@/lib/console-data";

export type SwitchItem = {
  id: string;
  label: string;
  hint: string;
  on: boolean;
  /** Saved, but nothing acts on it yet. */
  soon?: boolean;
};

/** A list of on/off settings, each saved to the doctor's profile as it is flipped. */
export function SwitchList({ group, items }: { group: SettingGroup; items: SwitchItem[] }) {
  const [state, setOptimistic] = useOptimistic(
    Object.fromEntries(items.map((item) => [item.id, item.on])),
    (current, change: { id: string; on: boolean }) => ({ ...current, [change.id]: change.on }),
  );
  const [, startTransition] = useTransition();

  function toggle(id: string, on: boolean) {
    startTransition(async () => {
      setOptimistic({ id, on });
      await updateSetting(group, id, on);
    });
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const on = state[item.id];
        return (
          <li key={item.id} className="flex items-center gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p id={`${item.id}-label`} className="text-sm font-semibold text-ink">
                {item.label}
                {item.soon ? (
                  <span className="ml-2 rounded-full bg-selected px-2 py-0.5 text-xs font-bold text-body">Coming soon</span>
                ) : null}
              </p>
              <p className="text-xs text-body">{item.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-labelledby={`${item.id}-label`}
              onClick={() => toggle(item.id, !on)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-muted"}`}
            >
              <span
                aria-hidden
                className={`absolute top-1 size-5 rounded-full bg-white transition-[left] ${on ? "left-6" : "left-1"}`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
