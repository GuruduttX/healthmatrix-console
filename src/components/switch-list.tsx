"use client";

import { useState } from "react";

export type SwitchItem = { id: string; label: string; hint: string; on: boolean };

/** A list of on/off settings. Holds its own state until settings are saved to the database. */
export function SwitchList({ items }: { items: SwitchItem[] }) {
  const [state, setState] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.on])));

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const on = state[item.id];
        return (
          <li key={item.id} className="flex items-center gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p id={`${item.id}-label`} className="text-sm font-semibold text-ink">
                {item.label}
              </p>
              <p className="text-xs text-body">{item.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-labelledby={`${item.id}-label`}
              onClick={() => setState((s) => ({ ...s, [item.id]: !on }))}
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
