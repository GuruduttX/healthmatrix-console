import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getScreeningReport } from "@/lib/console-data";

export const runtime = "nodejs";

/**
 * Opens a pod screening's PDF report with a fresh link from Mobilab, whose links last about an
 * hour. Only while the patient's record is open; the view is logged on the access grant.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/patients/[id]/records/[rid]/report">) {
  const { id, rid } = await ctx.params;
  const record = `/patients/${id}/records/${rid}`;
  const report = await getScreeningReport(id, rid);
  // Record closed, or nothing to open: the record page says which.
  if (!report) redirect(record);
  if ("problem" in report) redirect(`${record}?report=${report.problem}`);
  redirect(report.url);
}
