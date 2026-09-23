"use client";

import { createContext, useContext, type Dispatch } from "react";

import {
  initialSessionState,
  type SessionAction,
  type SessionState,
} from "@/lib/session-reducer";

const SessionStateContext = createContext<SessionState>(initialSessionState);
const SessionDispatchContext = createContext<Dispatch<SessionAction>>(() => {
  throw new Error("useSessionDispatch used outside of a session provider");
});

export const SessionStateProvider = SessionStateContext.Provider;
export const SessionDispatchProvider = SessionDispatchContext.Provider;

export function useSession(): SessionState {
  return useContext(SessionStateContext);
}

export function useSessionDispatch(): Dispatch<SessionAction> {
  return useContext(SessionDispatchContext);
}

/**
 * The conversation screens only ever render inside the `conversation` phase, so they
 * shouldn't each have to re-narrow the union. Throws rather than returning null: if
 * this fires, a component is mounted somewhere it has no business being.
 */
export function useConversation() {
  const state = useSession();

  if (state.phase !== "conversation") {
    throw new Error(
      `useConversation() requires the "conversation" phase, got "${state.phase}"`,
    );
  }

  return state;
}
