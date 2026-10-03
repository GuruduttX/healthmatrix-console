"use client";

import { FileText, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { RecordAnswer } from "@/lib/types";

const NOT_FOUND = "Nothing on file answers that. Try different words, or check the timeline.";

/** Picks the canned answer that shares the most words with the question. */
function findAnswer(question: string, qa: RecordAnswer[]): RecordAnswer {
  const words = question.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
  let best: RecordAnswer | undefined;
  let bestScore = 0;
  for (const entry of qa) {
    const text = `${entry.question} ${entry.answer}`.toLowerCase();
    const score = words.filter((w) => text.includes(w)).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best ? { ...best, question } : { question, answer: NOT_FOUND };
}

export function AskRecord({ qa }: { qa: RecordAnswer[] }) {
  const [thread, setThread] = useState<RecordAnswer[]>(qa.slice(0, 1));
  const [draft, setDraft] = useState("");

  const suggestions = qa.filter((entry) => !thread.some((t) => t.question === entry.question));

  function submit(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setThread((t) => [...t, findAnswer(question, qa)]);
    setDraft("");
  }

  return (
    <div className="mt-4">
      <ol className="flex flex-col gap-3" aria-live="polite">
        {thread.map((entry, i) => (
          <li key={i} className="flex flex-col gap-2">
            <p className="ml-8 self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-sm text-white">
              {entry.question}
            </p>
            <div className="mr-4 rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink">
              {entry.answer}
              {entry.source ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-body">
                  <FileText aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  Source: {entry.source}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((entry) => (
            <button
              key={entry.question}
              type="button"
              onClick={() => setThread((t) => [...t, entry])}
              className="rounded-full border border-line px-3 py-1.5 text-left text-xs font-semibold text-ink hover:bg-selected"
            >
              {entry.question}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Ask about this patient"
          placeholder="Ask about this patient"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-body focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Ask"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-danger"
        >
          <Send aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}
