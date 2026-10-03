"use client";

import { useReducer } from "react";

import { ConversationScreen } from "@/components/conversation/conversation-screen";
import { StateStepper } from "@/components/dev/state-stepper";
import { SetupScreen } from "@/components/setup-screen/setup-screen";
import { useChatDriver } from "@/hooks/use-chat-driver";
import { useMockDriver } from "@/hooks/use-mock-driver";
import { SessionDispatchProvider } from "@/hooks/use-session-dispatch";
import { LANGUAGES } from "@/lib/languages";
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

  useChatDriver(state, dispatch);

  // Still fakes two of the effect sources (TTS playback, live recognition) so the states
  // below are all reachable without a network or a mic; both go real in stage 3.
  useMockDriver(state, dispatch);

  function handleStart(config: SessionConfig) {
    dispatch({ type: "START", config });
  }

  return (
    <SessionDispatchProvider value={dispatch}>
      {state.phase === "setup" && (
        <SetupScreen lastConfig={state.lastConfig} onStart={handleStart} />
      )}

      {state.phase === "conversation" && (
        <>
          <ConversationScreen
            turns={state.turns}
            turnState={state.turnState}
            conversationLang={LANGUAGES[state.config.language].htmlLang}
          />
          <StateStepper
            config={state.config}
            turns={state.turns}
            turnState={state.turnState}
          />
        </>
      )}
    </SessionDispatchProvider>
  );
}
