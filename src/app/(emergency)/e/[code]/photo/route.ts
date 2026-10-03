import type { NextRequest } from "next/server";

import { findEmergencyPhoto } from "@/lib/emergency-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

/** Public: the member's photo for an active code, only while they show it. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/e/[code]/photo">) {
  const { code } = await ctx.params;
  const photo = await findEmergencyPhoto(code.toUpperCase());
  if (!photo) return new Response(null, { status: 404, headers: privateHeaders });

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      ...privateHeaders,
      "Content-Type": photo.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
