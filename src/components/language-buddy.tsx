"use client";

import { useReducer } from "react";

import { ConversationScreen } from "@/components/conversation/conversation-screen";
import { StateStepper } from "@/components/dev/state-stepper";
import { SetupScreen } from "@/components/setup-screen/setup-screen";
import { useMockDriver } from "@/hooks/use-mock-driver";
import {
  SessionDispatchProvider,
  SessionStateProvider,
} from "@/hooks/use-session";
import {
  initialSessionState,
  sessionReducer,
  type SessionConfig,
} from "@/lib/session-reducer";

/**
 * Owns the whole app's state. One session at a time, nothing persisted — closing the
 * tab ends it, which is what the brief asks for.
 */
export function LanguageBuddy() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  // Stage 1 only: fakes the three effect sources (chat fetch, TTS playback, live
  // recognition) so the states below are all reachable without a network or a mic.
  useMockDriver(state, dispatch);

  function handleStart(config: SessionConfig) {
    dispatch({ type: "START", config });
  }

  return (
    <SessionStateProvider value={state}>
      <SessionDispatchProvider value={dispatch}>
        {state.phase === "setup" && (
          <SetupScreen lastConfig={state.lastConfig} onStart={handleStart} />
        )}

        {state.phase === "conversation" && (
          <>
            <ConversationScreen
              turns={state.turns}
              turnState={state.turnState}
            />
            <StateStepper
              config={state.config}
              turns={state.turns}
              turnState={state.turnState}
            />
          </>
        )}
      </SessionDispatchProvider>
    </SessionStateProvider>
  );
}
