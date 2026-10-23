import type { CSSProperties } from "react";

/** The style that staggers one `data-reveal` after another: `style={revealDelay(120)}`. */
export function revealDelay(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}
