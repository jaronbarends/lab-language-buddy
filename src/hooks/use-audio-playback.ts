"use client";

import { useEffect, type Dispatch } from "react";

import type { SessionAction, SessionState } from "@/lib/session-reducer";

// ~2 ms of silence; only used to unlock the shared audio element inside a user gesture.
const SILENT_AUDIO_SRC =
  "data:audio/wav;base64,UklGRuwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

// One element for the whole session. iOS Safari lets an element play only if it was
// started inside a user gesture, and the AI's reply is played several awaited fetches
// later, when that gesture is long gone. So an element is started with silence during
// the click, and then reused (by changing its `src`) for every reply.
let sharedAudio: HTMLAudioElement | null = null;

/**
 * Must be called synchronously from a click handler, before anything awaits: in every
 * click that can lead to the AI speaking (Start chat, Send, Reply). Best-effort; a real
 * playback failure shows up in `useAudioPlayback`.
 *
 * Start chat is a form's submit button, so the call belongs in that button's `onClick`,
 * not in the form's `onSubmit`: the click always fires first, and pressing Enter makes
 * the browser fire a click on the default button too.
 */
export function unlockAudio(): void {
  sharedAudio ??= new Audio();
  sharedAudio.src = SILENT_AUDIO_SRC;
  sharedAudio.play().catch(() => {
    // Unlocking is allowed to fail; a refused unlock surfaces when the reply plays.
  });
}

/**
 * The spoken half of the AI's turn: while the turn state is `aiSpeaking`, fetch the
 * audio for that turn, play it, and answer with `AI_SPEECH_FINISHED` or
 * `AI_SPEECH_FAILED`. A failure is not an error state: the text is already on screen,
 * so the reducer degrades to text-only and this logs it.
 *
 * Leaving `aiSpeaking` (Reply cuts the AI off) ends everything in the effect cleanup:
 * the request is aborted, the handlers detached and the audio paused, so a late event
 * from this turn can't reach the next one.
 */
export function useAudioPlayback(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
  enabled: boolean,
): void {
  const speakingTurnId =
    state.phase === "conversation" && state.turnState.name === "aiSpeaking"
      ? state.turnState.turnId
      : null;
  const speakingText =
    state.phase === "conversation"
      ? state.turns.find((turn) => turn.id === speakingTurnId)?.text
      : undefined;
  const language = state.phase === "conversation" ? state.config.language : null;

  useEffect(() => {
    if (!enabled || !speakingTurnId || !speakingText || !language) {
      return;
    }

    const turnId = speakingTurnId;
    const audio = sharedAudio;
    const abortController = new AbortController();
    let objectUrl: string | null = null;

    function fail(error: unknown) {
      console.error(error);
      dispatch({ type: "AI_SPEECH_FAILED", turnId });
    }

    if (!audio) {
      fail(new Error("Audio was never unlocked"));
      return;
    }

    fetchSpeech(speakingText, language, abortController.signal)
      .then((speech) => {
        // The state may have been left between the response arriving and this running.
        if (abortController.signal.aborted) {
          return;
        }

        objectUrl = URL.createObjectURL(speech);
        audio.onended = () => dispatch({ type: "AI_SPEECH_FINISHED", turnId });
        audio.onerror = () => fail(new Error("Audio playback failed"));
        audio.src = objectUrl;
        return audio.play();
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }
        fail(error);
      });

    return () => {
      abortController.abort();
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [enabled, speakingTurnId, speakingText, language, dispatch]);
}

async function fetchSpeech(
  text: string,
  language: string,
  signal: AbortSignal,
): Promise<Blob> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Speech request failed with status ${response.status}`);
  }

  return response.blob();
}
