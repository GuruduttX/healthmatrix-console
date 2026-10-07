"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Screens that bring their own header and action bar on phones, like an app's full-screen form. */
const FOCUS_SCREENS = ["/profile/edit"];

export const isFocusScreen = (pathname: string) => FOCUS_SCREENS.some((path) => pathname.startsWith(path));

/** Hides the console's top bar on phones while a focus screen is open. */
export function HideOnFocusScreens({ children }: { children: ReactNode }) {
  const focus = isFocusScreen(usePathname());
  return <div className={focus ? "contents max-lg:hidden" : "contents"}>{children}</div>;
}
