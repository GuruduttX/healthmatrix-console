"use client";

import { FlaskConical, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";

import { DialogError, DialogFooter, DialogHeader } from "@/components/dialog-parts";
import { loadLabCatalog } from "@/lib/console-actions";
import type { LabCatalog, LabTestInput } from "@/lib/lab-tests";

type Profile = LabCatalog["profiles"][number];
type Test = LabCatalog["tests"][number];

const sameChoice = (a: LabTestInput, kind: LabTestInput["kind"], code: string) => a.kind === kind && a.code === code;

/**
 * Picks the lab tests on a prescription from Mobilab's catalog: health checks (several tests at
 * once) and single tests, as many as needed. A pod booking takes each test once, so picking a
 * health check greys out the tests in it and any health check sharing one, with the reason.
 */
export function LabTestDialog({
  selected,
  onSave,
  onClose,
}: {
  /** The tests already on the prescription, ticked when the dialog opens. */
  selected: LabTestInput[];
  onSave: (tests: LabTestInput[]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [catalog, setCatalog] = useState<LabCatalog>();
  const [error, setError] = useState<string>();
  const [loading, startLoading] = useTransition();
  const [chosen, setChosen] = useState(selected);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function load() {
    setError(undefined);
    startLoading(async () => {
      const result = await loadLabCatalog();
      if (result.catalog) setCatalog(result.catalog);
      else setError(result.error);
    });
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the catalog is fetched when the dialog opens
  useEffect(load, []);

  /** Which choice already holds each test code, by its name. */
  const holder = new Map<string, string>();
  for (const choice of chosen) for (const code of choice.tests) holder.set(code, choice.name);

  function toggle(choice: LabTestInput) {
    setChosen((list) =>
      list.some((c) => sameChoice(c, choice.kind, choice.code))
        ? list.filter((c) => !sameChoice(c, choice.kind, choice.code))
        : [...list, choice],
    );
  }

  const needle = query.trim().toLowerCase();
  const matches = (...words: string[]) => !needle || words.some((word) => word.toLowerCase().includes(needle));
  const profiles = catalog?.profiles.filter((p) => matches(p.name, p.id, ...p.tests.map((t) => t.name))) ?? [];
  const tests = catalog?.tests.filter((t) => matches(t.name, t.code)) ?? [];

  /** Why a health check can't be picked: one of its tests is already in another choice. */
  function profileBlock(profile: Profile) {
    const shared = profile.tests.find((t) => holder.has(t.code));
    return shared ? `Shares ${shared.name} with ${holder.get(shared.code)}` : undefined;
  }

  /** Why a single test can't be picked: a chosen health check already has it. */
  const testBlock = (test: Test) => (holder.has(test.code) ? `In ${holder.get(test.code)}` : undefined);

  const testCount = holder.size;
  const unchanged = JSON.stringify(chosen) === JSON.stringify(selected);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className="sheet m-0 h-dvh max-h-none w-full max-w-none bg-card p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:h-fit sm:max-h-[90dvh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-line sm:shadow-floating"
    >
      <div className="flex h-full flex-col sm:max-h-[90dvh]">
        <div className="border-b border-line pb-3">
          <DialogHeader
            titleId={`${id}-title`}
            title={selected.length ? "Edit tests" : "Add tests"}
            icon={FlaskConical}
            onClose={onClose}
          />
          <div className="px-5 pt-2">
            <label htmlFor={`${id}-search`} className="sr-only">
              Search tests
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a test or health check"
                autoComplete="off"
                className="field w-full pl-9"
              />
            </div>
            {chosen.length ? (
              <ul aria-label="Chosen" className="mt-3 flex flex-wrap gap-1.5">
                {chosen.map((choice) => (
                  <li key={`${choice.kind}-${choice.code}`}>
                    <button
                      type="button"
                      onClick={() => toggle(choice)}
                      aria-label={`Remove ${choice.name}`}
                      className="chip min-h-8 gap-1 py-1 pl-3 pr-2 text-xs font-semibold"
                    >
                      {choice.name}
                      <X aria-hidden className="size-3.5 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading && !catalog ? (
            <p role="status" className="flex items-center justify-center gap-2 py-12 text-[13px] text-body">
              <LoaderCircle aria-hidden className="size-4 animate-spin text-muted" />
              Loading the lab’s tests…
            </p>
          ) : error ? (
            <div className="px-2 py-6">
              <DialogError>{error}</DialogError>
              <button type="button" onClick={load} disabled={loading} className="btn btn-secondary btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : catalog ? (
            <>
              {profiles.length ? (
                <Group title="Health checks" note="Several tests at once">
                  {profiles.map((profile) => {
                    const choice: LabTestInput = {
                      kind: "profile",
                      code: profile.id,
                      name: profile.name,
                      tests: profile.tests.map((t) => t.code),
                    };
                    const checked = chosen.some((c) => sameChoice(c, "profile", profile.id));
                    return (
                      <Choice
                        key={profile.id}
                        name={profile.name}
                        detail={`${profile.tests.length} tests: ${profile.tests.map((t) => t.name).join(", ")}`}
                        checked={checked}
                        blocked={checked ? undefined : profileBlock(profile)}
                        onToggle={() => toggle(choice)}
                      />
                    );
                  })}
                </Group>
              ) : null}
              {tests.length ? (
                <Group title="Single tests">
                  {tests.map((test) => {
                    const checked = chosen.some((c) => sameChoice(c, "test", test.code));
                    return (
                      <Choice
                        key={test.code}
                        name={test.name}
                        detail={[test.code, test.sampleType].filter(Boolean).join(" · ")}
                        checked={checked}
                        blocked={checked ? undefined : testBlock(test)}
                        onToggle={() => toggle({ kind: "test", code: test.code, name: test.name, tests: [test.code] })}
                      />
                    );
                  })}
                </Group>
              ) : null}
              {!profiles.length && !tests.length ? (
                <p className="px-2 py-10 text-center text-[13px] text-body">No test matches “{query.trim()}”.</p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="border-t border-line">
          <p role="status" className="px-5 pt-3 text-xs text-muted">
            {chosen.length
              ? `${chosen.length} chosen, ${testCount} ${testCount === 1 ? "test" : "tests"} in all.`
              : "Nothing chosen yet."}
          </p>
          <DialogFooter>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(chosen)}
              disabled={unchanged}
              className="btn btn-primary"
            >
              {selected.length ? "Save tests" : "Add to prescription"}
            </button>
          </DialogFooter>
        </div>
      </div>
    </dialog>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="not-first:mt-3">
      <h3 className="px-2 pb-1 pt-1 text-xs font-bold text-body">
        {title}
        {note ? <span className="font-normal text-muted">, {note.toLowerCase()}</span> : null}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

/** One test or health check to tick. `blocked`: why it can't be ticked now. */
function Choice({
  name,
  detail,
  checked,
  blocked,
  onToggle,
}: {
  name: string;
  detail: string;
  checked: boolean;
  blocked?: string;
  onToggle: () => void;
}) {
  const id = useId();
  return (
    <li>
      <label
        htmlFor={id}
        className={`flex items-start gap-3 rounded-xl px-2 py-2.5 ${
          blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-surface"
        } ${checked ? "bg-brand-soft/60" : ""}`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={Boolean(blocked)}
          onChange={onToggle}
          className="mt-0.5 size-4.5 shrink-0 accent-brand"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{name}</span>
          <span className="line-clamp-2 block text-xs text-muted">{blocked ?? detail}</span>
        </span>
      </label>
    </li>
  );
}
