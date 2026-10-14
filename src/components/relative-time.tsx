"use client";

import { useEffect, useState } from "react";

/** "in 25 min", "in 1 h 5 min", "now" or "12 min ago", from whole minutes away. */
function relative(minutes: number) {
  if (minutes >= 60) {
    const rest = minutes % 60;
    return `in ${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ""}`;
  }
  if (minutes >= 1) return `in ${minutes} min`;
  if (minutes > -1) return "now";
  const ago = -minutes;
  return ago >= 60 ? `${Math.floor(ago / 60)} h ${ago % 60} min ago` : `${ago} min ago`;
}

/**
 * How far `at` is from now, kept current while the screen is open. The server's first guess
 * can be a minute off from the browser's, so the text is allowed to differ on hydration.
 */
export function RelativeTime({ at }: { at: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.trunc((Date.parse(at) - now) / 60_000);
  return (
    <time dateTime={at} suppressHydrationWarning>
      {relative(minutes)}
    </time>
  );
}
