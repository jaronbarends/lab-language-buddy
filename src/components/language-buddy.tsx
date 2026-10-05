"use client";

import { useReducer } from "react";

import { ConversationScreen } from "@/components/conversation/conversation-screen";
import { StateStepper } from "@/components/dev/state-stepper";
import { SetupScreen } from "@/components/setup-screen/setup-screen";
import { useChatDriver } from "@/hooks/use-chat-driver";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useLiveTranscription } from "@/hooks/use-live-transcription";
import { useMockTts } from "@/hooks/use-mock-tts";
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

  useLiveTranscription(state, dispatch);

  // Exactly one of these two plays the AI's turn. Read as a literal property so Next can
  // inline it at build time; the TTS mock is client-side because it has no audio.
  const ttsIsMocked = process.env.NEXT_PUBLIC_USE_MOCK_TTS === "true";
  useAudioPlayback(state, dispatch, !ttsIsMocked);
  useMockTts(state, dispatch, ttsIsMocked);

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
