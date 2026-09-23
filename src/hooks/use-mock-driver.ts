"use client";

import { useEffect, type Dispatch } from "react";

import {
  mockAiLine,
  mockTranscriptAt,
  mockUserLine,
  wordCountOf,
} from "@/lib/mock-conversation";
import { countWords } from "@/lib/word-timing";
import type { SessionAction, SessionState } from "@/lib/session-reducer";

/**
 * Stage 1 stand-in for the three real drivers that arrive later: the Gemini fetch
 * (stage 2), the TTS playback ticker and the Deepgram socket (stage 3).
 *
 * It dispatches exactly the actions those drivers will dispatch, on roughly the
 * timings they'll have, so the UI and the reducer are being exercised for real —
 * only the source of the events is fake. Whole file is deleted in stage 3.
 */

/** Rough pace of synthesised speech; only has to look plausible. */
const SPOKEN_MS_PER_WORD = 240;
/** Recognition lags speech slightly, so this is a touch slower. */
const RECOGNISED_MS_PER_WORD = 300;
const AI_THINKING_MS = 1300;

export function useMockDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const phase = state.phase;
  const turnStateName =
    state.phase === "conversation" ? state.turnState.name : null;

  // --- The AI "thinking", i.e. the /api/chat round trip -------------------------
  useEffect(() => {
    if (phase !== "conversation" || turnStateName !== "aiThinking") {
      return;
    }

    const timeoutId = setTimeout(() => {
      const aiTurnIndex = countTurnsBy(state, "ai");
      dispatch({
        type: "AI_TURN_RECEIVED",
        turn: {
          id: crypto.randomUUID(),
          author: "ai",
          text: mockAiLine(state.config.language, aiTurnIndex),
        },
      });
    }, AI_THINKING_MS);

    return () => clearTimeout(timeoutId);
    // `state` is deliberately absent: re-running on every turns change would restart
    // the timer. Entering the state is the trigger, and the values read inside the
    // callback are correct as of the moment it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnStateName, dispatch]);

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
        dispatch({ type: "AI_SPEECH_FINISHED" });
        return;
      }

      dispatch({ type: "AI_SPEECH_PROGRESSED", spokenWordCount });
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
        // user taps Stop, so we just hold the finished transcript here.
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
