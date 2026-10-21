import { isValidObjectId } from "mongoose";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { QUESTION_MAX, type AskEvent } from "@/lib/ask";
import { clearAskHistory, getAskHistory, saveAskExchange } from "@/lib/ask-history";
import { getSession } from "@/lib/auth";
import { getAskContext, getPatient } from "@/lib/console-data";
import { askEkaay, ekaayProblem, ekaayReady, type AskTurn } from "@/lib/ekaay";

export const runtime = "nodejs";
export const maxDuration = 120;

/** How many earlier questions, each with its answer, go back to Ekaay with a new one. */
const EXCHANGES_SENT = 6;

const askSchema = z.object({
  question: z.string().trim().min(1, "Ask a question").max(QUESTION_MAX, "Ask a shorter question"),
  /** The entry the doctor has open, if they're on one. */
  recordId: z.string().max(64).optional(),
});

const refuse = (error: string, status: number) => Response.json({ error }, { status });

/** The signed-in doctor, or null when their session has ended. */
async function signedInDoctor() {
  const session = await getSession();
  return session?.doctor?.isActive ? session.doctor : null;
}

/**
 * The doctor's conversation about this patient so far, while the patient's OTP keeps the record
 * open. The "Ask the record" box loads it each time it appears.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/patients/[id]/ask">) {
  const { id } = await ctx.params;
  const doctor = await signedInDoctor();
  if (!doctor) return refuse("Your session ended. Sign in again.", 401);
  const found = await getPatient(id);
  if (found?.patient.access.status !== "active") return refuse("The record is closed.", 403);
  return Response.json({ exchanges: await getAskHistory(doctor._id, id) }, { headers: { "Cache-Control": "no-store" } });
}

/** "Start over": forgets the conversation. */
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/patients/[id]/ask">) {
  const { id } = await ctx.params;
  const doctor = await signedInDoctor();
  if (!doctor) return refuse("Your session ended. Sign in again.", 401);
  if (!isValidObjectId(id)) return refuse("There’s no such patient.", 404);
  await clearAskHistory(doctor._id, id);
  return new Response(null, { status: 204 });
}

/**
 * Ekaay answers the doctor's question about one patient from their whole record, only while the
 * patient's OTP keeps it open. The earlier questions come from the kept conversation. The answer
 * streams back as JSON lines (`AskEvent`) and is kept once it is whole. Each question is logged on
 * the access grant.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/patients/[id]/ask">) {
  const { id } = await ctx.params;
  if (!ekaayReady()) return refuse("Ekaay isn’t connected yet.", 503);
  const doctor = await signedInDoctor();
  if (!doctor) return refuse("Your session ended. Sign in again.", 401);

  const parsed = askSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return refuse(parsed.error.issues[0]?.message ?? "That question couldn’t be read.", 400);
  const { question, recordId } = parsed.data;

  const ask = await getAskContext(id, recordId);
  if (!ask) return refuse("The record is closed. Ask the patient for a new OTP to open it again.", 403);
  const earlier = await getAskHistory(doctor._id, id);
  const turns: AskTurn[] = [
    ...earlier.slice(-EXCHANGES_SENT).flatMap((e): AskTurn[] => [
      { role: "user", content: e.question },
      { role: "assistant", content: e.answer },
    ]),
    { role: "user", content: question },
  ];

  const encoder = new TextEncoder();
  // Stopped by the doctor, or they left the page: Claude stops writing too, and nothing is kept.
  const stop = new AbortController();
  request.signal.addEventListener("abort", () => stop.abort(), { once: true });
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AskEvent) => {
        if (!stop.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        send({ type: "sources", sources: ask.sources });
        let answer = "";
        for await (const text of askEkaay(ask.context, turns, stop.signal)) {
          answer += text;
          send({ type: "text", text });
        }
        if (!stop.signal.aborted && answer.trim()) {
          // Kept before "done", so a reload straight after still finds it.
          await saveAskExchange(doctor._id, id, { question, answer, sources: ask.sources }).catch((error: unknown) =>
            console.error(`[ekaay] couldn’t keep the answer on ${id}:`, String(error)),
          );
        }
        send({ type: "done" });
      } catch (error) {
        if (!stop.signal.aborted) {
          console.error(`[ekaay] question on ${id} failed:`, String(error));
          send({ type: "error", message: ekaayProblem(error) });
        }
      }
      if (!stop.signal.aborted) controller.close();
    },
    cancel() {
      stop.abort();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
