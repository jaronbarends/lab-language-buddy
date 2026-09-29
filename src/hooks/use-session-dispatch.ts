"use client";

import { createContext, useContext, type Dispatch } from "react";

import type { SessionAction } from "@/lib/session-reducer";

const SessionDispatchContext = createContext<Dispatch<SessionAction>>(() => {
  throw new Error("useSessionDispatch used outside of a session provider");
});

export const SessionDispatchProvider = SessionDispatchContext.Provider;

export function useSessionDispatch(): Dispatch<SessionAction> {
  return useContext(SessionDispatchContext);
}
