"use client";

import { Plus, X } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";

import { tidyText, type Suggestion } from "@/lib/onboarding";

const MAX_SHOWN = 8;

/**
 * Pick several values from suggestions that narrow as you type, or add your own with Enter.
 * Each chosen value is posted as a hidden `name` field. The text box itself is never posted,
 * so browser autofill can't slip a value in.
 */
export function TagInput({
  id,
  name,
  suggestions,
  defaultValue,
  placeholder,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  name: string;
  suggestions: Suggestion[];
  defaultValue: string[];
  placeholder: string;
  invalid?: boolean;
  describedBy?: string;
  onChange?: (values: string[]) => void;
}) {
  const listId = useId();
  const [values, setValues] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const labelOf = (value: string) => suggestions.find((s) => s.value === value)?.label ?? value;
  const chosen = new Set(values.map((v) => v.toLowerCase()));
  const typed = tidyText(query);
  const lower = typed.toLowerCase();

  const matches = suggestions
    .filter((s) => !chosen.has(s.value.toLowerCase()) && s.label.toLowerCase().includes(lower))
    // Names that start with what was typed come first.
    .sort((a, b) => Number(!a.label.toLowerCase().startsWith(lower)) - Number(!b.label.toLowerCase().startsWith(lower)))
    .slice(0, MAX_SHOWN);
  const exact = suggestions.some((s) => s.label.toLowerCase() === lower);
  const canAddTyped = typed.length >= 2 && !exact && !chosen.has(lower);
  const options: (Suggestion & { custom?: boolean })[] = [
    ...matches,
    ...(canAddTyped ? [{ value: typed, label: typed, custom: true }] : []),
  ];
  const showList = open && options.length > 0;
  // Hovering can leave the highlight past the end of a list that has since got shorter.
  const current = Math.min(active, options.length - 1);

  function update(next: string[]) {
    setValues(next);
    onChange?.(next);
  }

  function add(value: string) {
    if (!chosen.has(value.toLowerCase())) update([...values, value]);
    setQuery("");
    setActive(0);
    // Close after each pick so the list doesn't cover the buttons below.
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive(options.length ? (current + step + options.length) % options.length : 0);
    } else if (event.key === "Enter" || event.key === ",") {
      // Never submit the form or move to the next step from here.
      event.preventDefault();
      event.stopPropagation();
      const option = showList ? options[current] : undefined;
      if (option) add(option.value);
      else if (canAddTyped) add(typed);
    } else if (event.key === "Backspace" && !query && values.length) {
      update(values.slice(0, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 focus-within:border-brand ${
          invalid ? "border-danger" : "border-line"
        }`}
      >
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1.5 text-sm font-semibold text-white"
          >
            {labelOf(value)}
            <button
              type="button"
              onClick={() => update(values.filter((v) => v !== value))}
              aria-label={`Remove ${labelOf(value)}`}
              className="inline-flex size-5 items-center justify-center rounded-full hover:bg-white/20"
            >
              <X aria-hidden className="size-3.5" />
            </button>
            <input type="hidden" name={name} value={value} />
          </span>
        ))}
        <input
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${current}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          value={query}
          placeholder={values.length ? "Add another" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="min-w-32 flex-1 bg-transparent py-1.5 text-ink placeholder:text-body focus:outline-none focus-visible:outline-none"
        />
      </div>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-card p-1 shadow-floating"
        >
          {options.map((option, i) => (
            <li
              key={`${option.custom ? "custom" : "s"}-${option.value}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === current}
              // Keep focus in the text box while picking.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(option.value)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink ${
                i === current ? "bg-selected" : ""
              }`}
            >
              {option.custom ? (
                <>
                  <Plus aria-hidden className="size-4 text-brand" />
                  Add “{option.label}”
                </>
              ) : (
                option.label
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
