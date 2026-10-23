"use client";

import dynamic from "next/dynamic";

/**
 * The tour and its six previews are the page's heaviest script, and they sit below the fold, so
 * they come in their own chunk. The server still renders them, so the copy is in the HTML.
 */
export const FeatureTourLazy = dynamic(() => import("./feature-tour"), {
  loading: () => <div className="mt-14 h-[60vh] animate-pulse rounded-4xl bg-white/40 lg:mt-20" />,
});
