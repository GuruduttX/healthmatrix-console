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

/**
 * An on/off switch's track, as the app's: the blue teal of "on" when on, a see-through grey when
 * off, so it takes the glass's tint and still reads. `before:` widens what a finger can hit.
 */
export const switchTrack = (on: boolean) =>
  `relative h-7 w-12 shrink-0 rounded-full shadow-[inset_0_1px_2px_rgba(30,50,70,0.1)] transition-colors duration-200 before:absolute before:-inset-2 ${on ? "bg-success" : "bg-line-strong"}`;

/** Its white knob, with a light, cool lift. */
export const switchKnob = (on: boolean) =>
  `absolute top-0.5 size-6 rounded-full bg-white shadow-[0_1px_2px_rgba(30,50,70,0.12),0_2px_6px_rgba(30,50,70,0.16)] transition-[left] duration-200 ${on ? "left-5.5" : "left-0.5"}`;

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
              <p id={`${item.id}-label`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-ink">
                {item.label}
                {item.soon ? (
                  <span className="rounded-full bg-selected px-2 py-px text-[11px] font-bold leading-4 text-ink-mid">Coming soon</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-body">{item.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-labelledby={`${item.id}-label`}
              onClick={() => toggle(item.id, !on)}
              className={switchTrack(on)}
            >
              <span aria-hidden className={switchKnob(on)} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
