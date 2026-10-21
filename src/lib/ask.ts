/** Shared by the ask route and the "Ask the record" box: safe for the browser. */

/** The longest question a doctor can ask. */
export const QUESTION_MAX = 2_000;

/** How long a conversation is kept after its last question. */
export const ASK_KEPT_HOURS = 6;

/** `[R3]` or `[R3, R5]`: the record entries an answer cites. */
export const CITATION = /\[(R\d+(?:\s*,\s*R\d+)*)\]/g;

/** An entry Ekaay may cite as `[R3]`, so its answer can link back to it. */
export type AskSource = { ref: string; id: string; title: string; date: string };

/** A question and its whole answer, as kept: `sources` holds only the entries the answer cites. */
export type AskExchange = { question: string; answer: string; sources: AskSource[] };

/** One line of the answer stream, as JSON: the entries it can cite first, then the text as it comes. */
export type AskEvent =
  | { type: "sources"; sources: AskSource[] }
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
