"use client";

import { ArrowUp, RotateCcw, Sparkles, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconTile } from "@/components/ui";
import { CITATION, QUESTION_MAX, type AskEvent, type AskExchange, type AskSource } from "@/lib/ask";

type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; sources: Map<string, AskSource>; error?: string; stopped?: boolean };

const patientQuestions = [
  "Summarise their history",
  "Which results are out of range?",
  "How have their readings changed?",
  "Any clashes with their allergies or medicines?",
];

const entryQuestions = [
  "Explain this result",
  "How does this compare with earlier results?",
  "What would be worth checking next?",
];

/** A kept question and answer, as the conversation shows them. */
const turnsOf = (exchange: AskExchange): Turn[] => [
  { role: "user", content: exchange.question },
  { role: "assistant", content: exchange.answer, sources: new Map(exchange.sources.map((s) => [s.ref, s])) },
];

/**
 * Questions about the patient, answered by Ekaay from their whole record while it is open, each
 * answer citing the entries it came from. With `recordId`, the entry the doctor has open comes
 * first. Whole answers are kept on the server for 6 hours after the last question, for this doctor
 * only, so the same conversation is here on the patient, entry and consult pages and after a reload.
 */
export function AskRecord({
  ready,
  memberId,
  patientName,
  recordId,
}: {
  /** Whether Claude is set up (`ekaayReady()`). */
  ready: boolean;
  memberId: string;
  patientName: string;
  recordId?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  /** Fetching the kept conversation; questions wait until it is in. */
  const [loading, setLoading] = useState(ready);
  const stopper = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // Keep the answer in view as it is written.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  // The box grows with the question, up to its max height.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [question]);

  // The conversation so far, fetched each time the box appears: a page restored by Back may be older.
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    fetch(`/patients/${memberId}/ask`, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<{ exchanges: AskExchange[] }>) : null))
      .then((body) => setTurns(body?.exchanges.flatMap(turnsOf) ?? []))
      // No kept conversation to show: the box starts empty.
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ready, memberId]);

  // Stop an answer still coming in when the doctor leaves.
  useEffect(() => () => stopper.current?.abort(), []);

  if (!ready) {
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

  /** Changes the answer being written, the last turn. */
  function updateAnswer(change: (answer: Extract<Turn, { role: "assistant" }>) => Partial<Extract<Turn, { role: "assistant" }>>) {
    setTurns((all) => {
      const last = all.at(-1);
      if (last?.role !== "assistant") return all;
      return [...all.slice(0, -1), { ...last, ...change(last) }];
    });
  }

  async function ask(text: string, earlier = turns) {
    const asked = text.trim();
    if (!asked || busy || loading) return;

    setTurns([...earlier, { role: "user", content: asked }, { role: "assistant", content: "", sources: new Map() }]);
    setQuestion("");
    setBusy(true);
    const controller = new AbortController();
    stopper.current = controller;

    try {
      const res = await fetch(`/patients/${memberId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server adds the earlier questions from the kept conversation.
        body: JSON.stringify({ question: asked, recordId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body || !res.headers.get("Content-Type")?.includes("ndjson")) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        // Sent to the sign-in page instead: the session ran out.
        throw new Error(body?.error ?? (res.redirected ? "Your session ended. Sign in again." : "Ekaay couldn’t answer just now. Try again."));
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          let event: AskEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "sources") updateAnswer(() => ({ sources: new Map(event.sources.map((s) => [s.ref, s])) }));
          else if (event.type === "text") updateAnswer((a) => ({ content: a.content + event.text }));
          else if (event.type === "error") throw new Error(event.message);
          else if (event.type === "done") finished = true;
        }
      }
      if (!finished) throw new Error("The answer was cut off. Try again.");
    } catch (error) {
      if (controller.signal.aborted) updateAnswer(() => ({ stopped: true }));
      else updateAnswer(() => ({ error: error instanceof Error ? error.message : "Ekaay couldn’t answer just now. Try again." }));
    } finally {
      stopper.current = null;
      setBusy(false);
    }
  }

  function retry() {
    const lastQuestion = turns.findLast((t) => t.role === "user");
    if (lastQuestion) ask(lastQuestion.content, turns.slice(0, -2));
  }

  function startOver() {
    stopper.current?.abort();
    setTurns([]);
    box.current?.focus();
    // Forgotten on the server too, so it doesn't come back on the next visit.
    fetch(`/patients/${memberId}/ask`, { method: "DELETE" }).catch(() => {});
  }

  const suggestions = recordId ? entryQuestions : patientQuestions;
  const last = turns.at(-1);
  const failed = !busy && last?.role === "assistant" && last.error;

  return (
    <div className="mt-4">
      {loading ? (
        <p className="text-[13px] leading-relaxed text-muted" role="status">
          Loading the conversation…
        </p>
      ) : turns.length === 0 ? (
        <div>
          <p className="text-[13px] leading-relaxed text-body">
            Ask about {patientName}’s results, medicines, vaccines or history. Ekaay answers from the
            record {recordId ? "with this entry first, " : ""}and links each fact to its entry.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="pressable glass-flat rounded-full px-3.5 py-2 text-left text-[13px] font-semibold leading-snug text-ink hover:bg-white/60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={log}
          role="log"
          aria-label={`Questions about ${patientName}’s record`}
          aria-busy={busy}
          className="-mx-1 flex max-h-128 flex-col gap-4 overflow-y-auto px-1 pb-1"
        >
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <p
                key={i}
                className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-soft px-3.5 py-2.5 text-sm leading-relaxed text-ink"
              >
                {turn.content}
              </p>
            ) : (
              <Answer key={i} turn={turn} memberId={memberId} writing={busy && i === turns.length - 1} />
            ),
          )}
        </div>
      )}

      {failed ? (
        <button type="button" onClick={retry} className="btn btn-ghost btn-sm mt-2">
          <RotateCcw aria-hidden className="size-4" />
          Try again
        </button>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
        className="mt-4 flex items-end gap-2"
      >
        <label htmlFor={`ask-${recordId ?? memberId}`} className="sr-only">
          Your question about {patientName}
        </label>
        <textarea
          ref={box}
          id={`ask-${recordId ?? memberId}`}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            // Enter asks; Shift+Enter starts a new line.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              ask(question);
            }
          }}
          rows={1}
          maxLength={QUESTION_MAX}
          placeholder={recordId ? "Ask about this entry or the record" : `Ask about ${patientName}’s record`}
          className="field max-h-40 resize-none"
        />
        {busy ? (
          <button type="button" onClick={() => stopper.current?.abort()} className="btn btn-secondary btn-icon shrink-0" aria-label="Stop the answer">
            <Square aria-hidden className="size-3.5 fill-current" />
          </button>
        ) : (
          <button type="submit" disabled={!question.trim() || loading} className="btn btn-primary btn-icon shrink-0" aria-label="Ask">
            <ArrowUp aria-hidden className="size-4.5" />
          </button>
        )}
      </form>

      <div className="mt-2.5 flex items-start justify-between gap-3">
        <p className="text-xs leading-relaxed text-muted">Ekaay can be wrong. It informs; you diagnose and prescribe.</p>
        {turns.length > 0 ? (
          <button type="button" onClick={startOver} className="shrink-0 text-xs font-semibold text-body hover:text-ink">
            Start over
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Ekaay's answer: paragraphs and "- " lists, its citations as numbered links with the entries listed below. */
function Answer({
  turn,
  memberId,
  writing,
}: {
  turn: Extract<Turn, { role: "assistant" }>;
  memberId: string;
  writing: boolean;
}) {
  // Numbered in the order the answer first cites them; tags for entries that don't exist are dropped.
  const cited: AskSource[] = [];
  const numberOf = (ref: string) => {
    const source = turn.sources.get(ref);
    if (!source) return undefined;
    if (!cited.includes(source)) cited.push(source);
    return cited.indexOf(source) + 1;
  };

  function inline(text: string): ReactNode[] {
    const plain = text.replace(/\*\*/g, "");
    const parts: ReactNode[] = [];
    let at = 0;
    for (const match of plain.matchAll(CITATION)) {
      parts.push(plain.slice(at, match.index));
      at = match.index + match[0].length;
      for (const ref of match[1].split(/\s*,\s*/)) {
        const n = numberOf(ref);
        const source = turn.sources.get(ref);
        if (!n || !source) continue;
        parts.push(
          <Link
            key={`${match.index}-${ref}`}
            href={`/patients/${memberId}/records/${source.id}`}
            title={`${source.title}, ${source.date}`}
            className="ml-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-selected px-1 align-[0.1em] text-[11px] font-bold tabular-nums text-ink-mid hover:bg-brand-soft hover:text-brand-deep"
          >
            {n}
          </Link>,
        );
      }
    }
    parts.push(plain.slice(at));
    return parts;
  }

  // Runs of "- " lines become a list; everything else, paragraphs.
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of turn.content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const item = /^[-*•]\s+/.test(line);
    const text = line.replace(/^[-*•]\s+/, "").replace(/^#+\s*/, "");
    const open = blocks.at(-1);
    if (item && open?.list) open.lines.push(text);
    else blocks.push({ list: item, lines: [text] });
  }

  // Built before the source list below, which fills as citations are numbered.
  const body = blocks.map((block, i) =>
    block.list ? (
      <ul key={i} className="mt-2 flex flex-col gap-1.5 first:mt-0">
        {block.lines.map((line, j) => (
          <li key={j} className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            <span className="min-w-0">{inline(line)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p key={i} className="mt-2 first:mt-0">
        {inline(block.lines[0])}
      </p>
    ),
  );

  return (
    <div className="flex max-w-3xl gap-2.5">
      <IconTile icon={Sparkles} size="xs" look="solid" className="mt-0.5" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
        {blocks.length === 0 && writing ? <p className="text-body">Reading the record…</p> : null}
        {body}
        {turn.stopped ? <p className="mt-2 text-xs font-semibold text-muted">Stopped.</p> : null}
        {turn.error ? (
          <p role="alert" className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-[13px] font-semibold text-danger">
            {turn.error}
          </p>
        ) : null}

        {cited.length > 0 && !writing ? (
          <ol className="mt-3 flex flex-col gap-1 border-t border-line pt-2.5 text-xs">
            {cited.map((source, i) => (
              <li key={source.id}>
                <Link href={`/patients/${memberId}/records/${source.id}`} className="group inline-flex gap-1.5 text-body hover:text-ink">
                  <span className="font-bold tabular-nums text-muted">{i + 1}</span>
                  <span className="group-hover:underline">
                    {source.title}, {source.date}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
