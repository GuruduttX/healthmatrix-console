import type { Types } from "mongoose";

import { AskConversationModel } from "@/models";

import { ASK_KEPT_HOURS, CITATION, type AskExchange, type AskSource } from "./ask";
import { connectDB } from "./db";

/**
 * Each doctor's "Ask the record" conversation about a patient, kept for `ASK_KEPT_HOURS` after the
 * last question so it is still there after a reload or a visit to another page. Only the doctor
 * who asked sees it. Callers check that the patient's record is open first.
 */

const KEPT_MS = ASK_KEPT_HOURS * 60 * 60 * 1000;
/** The most questions a conversation keeps; older ones drop off the top. */
const EXCHANGES_KEPT = 30;

type Id = Types.ObjectId | string;

/** The conversation so far, oldest first; empty when there is none or it has run out. */
export async function getAskHistory(doctor: Id, member: Id): Promise<AskExchange[]> {
  await connectDB();
  const found = await AskConversationModel.findOne({ doctor, member, expiresAt: { $gt: new Date() } })
    .select("exchanges")
    .lean();
  return (found?.exchanges ?? []).map(({ question, answer, sources }) => ({
    question,
    answer,
    sources: sources.map(({ ref, id, title, date }) => ({ ref, id, title, date })),
  }));
}

/** Keeps a whole answer with the entries it cites, and the conversation for another 6 hours. */
export async function saveAskExchange(doctor: Id, member: Id, exchange: { question: string; answer: string; sources: AskSource[] }) {
  const cited = new Set([...exchange.answer.matchAll(CITATION)].flatMap((match) => match[1].split(/\s*,\s*/)));
  await connectDB();
  // MongoDB clears expired conversations about once a minute; one that ran out starts afresh.
  await AskConversationModel.deleteOne({ doctor, member, expiresAt: { $lte: new Date() } });
  await AskConversationModel.updateOne(
    { doctor, member },
    {
      $push: {
        exchanges: {
          $each: [
            {
              question: exchange.question,
              answer: exchange.answer,
              sources: exchange.sources.filter((source) => cited.has(source.ref)),
              askedAt: new Date(),
            },
          ],
          $slice: -EXCHANGES_KEPT,
        },
      },
      $set: { expiresAt: new Date(Date.now() + KEPT_MS) },
    },
    { upsert: true },
  );
}

/** "Start over": the conversation goes now rather than in 6 hours. */
export async function clearAskHistory(doctor: Id, member: Id) {
  await connectDB();
  await AskConversationModel.deleteOne({ doctor, member });
}
