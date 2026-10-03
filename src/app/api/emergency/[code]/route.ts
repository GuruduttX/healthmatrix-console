import type { NextRequest } from "next/server";

import { findEmergencyProfile } from "@/lib/emergency-db";

/**
 * Public: the fields the member chose to share for this QR code. No side
 * effects, so link previews and prefetches never count as a scan; the page
 * logs the scan with a POST to `./scans` once it has loaded in a real browser.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/emergency/[code]">) {
  const { code } = await ctx.params;
  const found = await findEmergencyProfile(code);

  // Unknown and revoked codes get the same answer.
  if (!found) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ profile: found.view });
}
