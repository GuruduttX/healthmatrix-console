import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Optimistic check only: sends visitors without a session cookie to the login page. The
 * real check (is the session valid, is onboarding done) is `requireDoctor()` on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The emergency QR page (and its photo) opens for everyone, signed in or not.
  if (pathname.startsWith("/e/")) {
    return NextResponse.next();
  }

  const signedIn = request.cookies.has(SESSION_COOKIE);
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Signed-in visitors are not bounced off /login here: a stale cookie would loop. The
  // login page sends a valid session on to the console itself.
  if (!signedIn && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$).*)"],
};
