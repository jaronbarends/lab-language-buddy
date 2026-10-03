"use client";

import { useEffect, type Dispatch } from "react";

import {
  mockTranscriptAt,
  mockUserLine,
  wordCountOf,
} from "@/lib/mock-conversation";
import { countWords } from "@/lib/word-timing";
import type { SessionAction, SessionState } from "@/lib/session-reducer";

/**
 * Stand-in for the two real drivers still to come: the TTS playback ticker and the
 * Deepgram socket (stage 3). The Gemini round trip is real since stage 2 — see
 * `use-chat-driver.ts`, which can be pointed at a mock route.
 *
 * It dispatches exactly the actions those drivers will dispatch, on roughly the
 * timings they'll have, so the UI and the reducer are being exercised for real —
 * only the source of the events is fake. The recognition effect is deleted in stage 3;
 * the TTS effect stays behind its own mock flag.
 */

/** Rough pace of synthesised speech; only has to look plausible. */
const SPOKEN_MS_PER_WORD = 240;
/** Recognition lags speech slightly, so this is a touch slower. */
const RECOGNISED_MS_PER_WORD = 300;

export function useMockDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const phase = state.phase;
  const turnStateName =
    state.phase === "conversation" ? state.turnState.name : null;

  // --- TTS playback, i.e. the audio element's ontimeupdate ----------------------
  const speakingTurnId =
    state.phase === "conversation" && state.turnState.name === "aiSpeaking"
      ? state.turnState.turnId
      : null;

  useEffect(() => {
    if (phase !== "conversation" || !speakingTurnId) {
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
  }, [phase, speakingTurnId, dispatch]);

  // --- Live recognition, i.e. Deepgram's interim/final results ------------------
  useEffect(() => {
    if (phase !== "conversation" || turnStateName !== "listening") {
      return;
    }

    const userTurnIndex = countTurnsBy(state, "user");
    const sentence = mockUserLine(state.config.language, userTurnIndex);
    const totalWords = wordCountOf(sentence);
    let heardWordCount = 0;

    const intervalId = setInterval(() => {
      heardWordCount += 1;

      if (heardWordCount > totalWords) {
        // Real speech stops when the speaker stops; the mic stays open until the
        // user sends, edits or cancels, so we just hold the finished transcript here.
        clearInterval(intervalId);
        return;
      }

      dispatch({
        type: "TRANSCRIPT_UPDATED",
        transcript: mockTranscriptAt(sentence, heardWordCount),
      });
    }, RECOGNISED_MS_PER_WORD);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnStateName, dispatch]);
}

function countTurnsBy(state: SessionState, author: "ai" | "user"): number {
  if (state.phase !== "conversation") {
    return 0;
  }
  return state.turns.filter((turn) => turn.author === author).length;
}

function findTurn(state: SessionState, turnId: string) {
  if (state.phase !== "conversation") {
    return undefined;
  }
  return state.turns.find((turn) => turn.id === turnId);
}
