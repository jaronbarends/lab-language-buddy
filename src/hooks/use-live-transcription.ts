"use client";

import { useEffect, type Dispatch } from "react";

import { startDeepgramTranscription } from "@/lib/stt/deepgram";
import {
  turnStateIs,
  type SessionAction,
  type SessionState,
} from "@/lib/session-reducer";

/**
 * The speech recognition engine: while the turn state is `listening`, audio goes out and
 * `TRANSCRIPT_UPDATED` comes back, or `FAILED` if any step breaks.
 *
 * Leaving `listening` (Send, Edit, Cancel, a failure) ends all of it in the effect
 * cleanup, and the engine detaches its handlers first, so nothing can arrive after the
 * state was left (the reducer's contract for async sources). Whatever the engine has not
 * yet flushed at that moment is dropped; the transcript on screen, interim words
 * included, is what Send, Edit and Cancel act on.
 */
export function useLiveTranscription(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const turnStateIsListening = turnStateIs(state, "listening");
  // Frozen for the session, so it never changes while `listening` stays true.
  const language = state.phase === "conversation" ? state.config.language : null;

  useEffect(() => {
    if (!turnStateIsListening || !language) {
      return;
    }

    // The engine returns the function that ends it, which is the effect cleanup.
    return startDeepgramTranscription(language, {
      onMicrophoneStarted() {
        dispatch({ type: "MICROPHONE_STARTED" });
      },
      onTranscript(transcript) {
        dispatch({ type: "TRANSCRIPT_UPDATED", transcript });
      },
      onFailed(message, error) {
        console.error(error);
        dispatch({
          type: "FAILED",
          message,
          detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        });
      },
    });
  }, [turnStateIsListening, language, dispatch]);
}
