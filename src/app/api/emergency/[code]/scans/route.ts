import type { NextRequest } from "next/server";

import { clientIp, findEmergencyProfile, logScan, parseLocation } from "@/lib/emergency-db";

/**
 * Public: logs a scan of this QR code. The body may carry the finder's location,
 * `{ "location": { "latitude": 28.61, "longitude": 77.21 } }`, if they allowed it.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/emergency/[code]/scans">) {
  const { code } = await ctx.params;
  const found = await findEmergencyProfile(code);
  if (!found) return Response.json({ error: "not_found" }, { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  const scan = await logScan({
    qrLinkId: found.qrLinkId,
    memberId: found.memberId,
    location: parseLocation(body),
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return Response.json(scan, { status: 201 });
}
