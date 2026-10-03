import type { NextRequest } from "next/server";

import { addScanLocation, findEmergencyProfile, parseLocation } from "@/lib/emergency-db";

/** Public: adds the finder's location to a scan, for when they allow it after the page loads. */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/emergency/[code]/scans/[scanId]">,
) {
  const { code, scanId } = await ctx.params;
  const location = parseLocation(await request.json().catch(() => null));
  if (!location) return Response.json({ error: "invalid_location" }, { status: 400 });

  const found = await findEmergencyProfile(code);
  if (!found) return Response.json({ error: "not_found" }, { status: 404 });

  const updated = await addScanLocation(scanId, found.qrLinkId, location);
  if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
