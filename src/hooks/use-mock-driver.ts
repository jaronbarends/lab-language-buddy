"use client";

import { useEffect, type Dispatch } from "react";

import { countWords } from "@/lib/word-timing";
import type { SessionAction, SessionState } from "@/lib/session-reducer";

/**
 * Stand-in for the TTS playback in `use-audio-playback.ts`, switched on by
 * `NEXT_PUBLIC_USE_MOCK_TTS` (see `LanguageBuddy`). Unlike the chat mock it has to live
 * on the client, since it has no audio to fetch.
 *
 * It dispatches exactly the actions the real driver dispatches, on roughly the timings
 * it has, so the UI and the reducer are being exercised for real — only the source of
 * the events is fake. Gemini (`use-chat-driver.ts`) and live recognition
 * (`use-live-transcription.ts`) have no mock here; Edit covers typed input.
 */

/** Rough pace of synthesised speech; only has to look plausible. */
const SPOKEN_MS_PER_WORD = 240;

export function useMockDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
  enabled: boolean,
): void {
  const phase = state.phase;

  // --- TTS playback, i.e. the audio element's ontimeupdate ----------------------
  const speakingTurnId =
    state.phase === "conversation" && state.turnState.name === "aiSpeaking"
      ? state.turnState.turnId
      : null;

  useEffect(() => {
    if (!enabled || phase !== "conversation" || !speakingTurnId) {
      return;
    }

    const spokenTurn = findTurn(state, speakingTurnId);
    if (!spokenTurn) {
      return;
    }

    const totalWords = countWords(spokenTurn.text);
    let spokenWordCount = 0;

    const intervalId = setInterval(() => {
      spokenWordCount += 1;

      if (spokenWordCount > totalWords) {
        clearInterval(intervalId);
        dispatch({ type: "AI_SPEECH_FINISHED", turnId: speakingTurnId });
        return;
      }

      dispatch({
        type: "AI_SPEECH_PROGRESSED",
        turnId: speakingTurnId,
        spokenWordCount,
      });
    }, SPOKEN_MS_PER_WORD);

    return () => clearInterval(intervalId);
    // Keyed on the turn id, not the turns array — same reasoning as the reducer's
    // comment on Turn.id. An index-based key here would restart the highlight
    // whenever an unrelated turn was appended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, phase, speakingTurnId, dispatch]);
}

function findTurn(state: SessionState, turnId: string) {
  if (state.phase !== "conversation") {
    return undefined;
  }
  return state.turns.find((turn) => turn.id === turnId);
}
