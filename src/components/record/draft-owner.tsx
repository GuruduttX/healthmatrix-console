"use client";

import { createContext, useContext, type ReactNode } from "react";

const Owner = createContext("");

/** Whose prescriptions in progress the screens below save and restore: the signed-in doctor. */
export function DraftOwner({ id, children }: { id: string; children: ReactNode }) {
  return <Owner value={id}>{children}</Owner>;
}

/** The signed-in doctor's id, or "" outside the console (autosave then stays off). */
export const useDraftOwner = () => useContext(Owner);
