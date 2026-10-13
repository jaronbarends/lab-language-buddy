import { LANGUAGES, type LanguageCode } from "@/lib/languages";

import {
  CONNECTION_FAILED_MESSAGE,
  MIC_DENIED_MESSAGE,
  MIC_FAILED_MESSAGE,
} from "./messages";
import type { SttCallbacks } from "./types";

const NOT_AVAILABLE_MESSAGE = "Speech recognition isn't available in this browser.";
const LANGUAGE_NOT_SUPPORTED_MESSAGE =
  "This browser can't recognize speech in this language.";
const RECOGNITION_FAILED_MESSAGE = "Speech recognition failed.";
const SERVICE_NOT_ALLOWED_MESSAGE =
  "Speech recognition isn't allowed or is switched off on this device.";

/** A session that ends sooner than this after it started counts as a quick end. */
const QUICK_END_MS = 1_500;

/**
 * Quick ends in a row before giving up, so a browser that ends every session at once
 * does not keep restarting forever. A session that lasts longer resets the count.
 */
const MAX_QUICK_ENDS = 3;

/**
 * Starts the browser's own speech recognition and returns the function that ends it.
 * Safe to call it twice.
 *
 * The browser ends a session by itself, for instance after a stretch of silence, while
 * the user is still `listening`. That is not the end of the turn, so a new session is
 * started and the words heard so far stay on screen: a new session begins with an empty
 * result list.
 *
 * Between a session's `onend` and the next session's start nothing is captured. That gap
 * has not been measured, and the UI is not told about it (`onMicrophoneStarted` is
 * reported only for the first session).
 */
export function startNativeTranscription(
  language: LanguageCode,
  callbacks: SttCallbacks,
): () => void {
  const recognitionConstructor = getRecognitionConstructor();

  if (!recognitionConstructor) {
    callbacks.onFailed(
      NOT_AVAILABLE_MESSAGE,
      new Error("SpeechRecognition is not available in this browser"),
    );
    return () => {};
  }

  let hasEnded = false;
  let hasReportedStart = false;
  let session: SpeechRecognition | null = null;
  let sessionStartedAt = 0;
  let quickEnds = 0;

  // Words from sessions that have ended, and from the one running now.
  let heardBefore = "";
  let sessionFinalized = "";
  let sessionInterim = "";

  function releaseSession(old: SpeechRecognition) {
    old.onstart = null;
    old.onresult = null;
    old.onerror = null;
    old.onend = null;
  }

  function stop() {
    hasEnded = true;
    if (session) {
      releaseSession(session);
      session.abort();
    }
  }

  function fail(message: string, error: unknown) {
    if (hasEnded) {
      return;
    }

    stop();
    callbacks.onFailed(message, error);
  }

  function startSession(Recognition: typeof SpeechRecognition) {
    const newSession = new Recognition();
    session = newSession;
    sessionFinalized = "";
    sessionInterim = "";
    sessionStartedAt = performance.now();

    newSession.lang = LANGUAGES[language].webSpeechLang;
    newSession.continuous = true;
    newSession.interimResults = true;

    newSession.onstart = () => {
      if (hasReportedStart) {
        return;
      }
      hasReportedStart = true;
      callbacks.onMicrophoneStarted();
    };

    newSession.onresult = (event) => {
      // Rebuilt from the full result list each time rather than only the new entries, so
      // whatever the browser revises ends up on screen.
      let finalized = "";
      let interim = "";
      for (let index = 0; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) {
          finalized = joinWords(finalized, result[0].transcript);
        } else {
          interim = joinWords(interim, result[0].transcript);
        }
      }

      sessionFinalized = finalized;
      sessionInterim = interim;
      callbacks.onTranscript({
        finalized: joinWords(heardBefore, sessionFinalized),
        interim: sessionInterim,
      });
    };

    newSession.onerror = (event) => {
      // Typed as a string: the error code type the package refers to is not declared.
      const code: string = event.error;
      const message = messageForError(code);
      if (message) {
        fail(message, new Error(`SpeechRecognition error: ${code}`));
      }
    };

    newSession.onend = () => {
      if (hasEnded) {
        return;
      }
      releaseSession(newSession);

      quickEnds =
        performance.now() - sessionStartedAt < QUICK_END_MS ? quickEnds + 1 : 0;
      if (quickEnds >= MAX_QUICK_ENDS) {
        fail(
          RECOGNITION_FAILED_MESSAGE,
          new Error("Speech recognition kept ending right after it started"),
        );
        return;
      }

      // The interim words are carried over too: releaseSession has already detached
      // onresult, so nothing can arrive after onend that would finalize or revise them,
      // and dropping them would remove words the user already saw on screen.
      heardBefore = joinWords(heardBefore, sessionFinalized, sessionInterim);
      startSession(Recognition);
    };

    try {
      newSession.start();
    } catch (error) {
      fail(RECOGNITION_FAILED_MESSAGE, error);
    }
  }

  startSession(recognitionConstructor);

  return stop;
}

function getRecognitionConstructor(): typeof SpeechRecognition | null {
  // The types declare both as always present; on a browser without them (Firefox) the
  // identifiers don't exist, which `typeof` can check without throwing.
  if (typeof SpeechRecognition !== "undefined") {
    return SpeechRecognition;
  }

  if (typeof webkitSpeechRecognition !== "undefined") {
    return webkitSpeechRecognition;
  }

  return null;
}

/**
 * The message for an error that ends listening, or null for one that doesn't: a stretch
 * of silence (`no-speech`) and our own `abort` just end the session, which then restarts
 * or has already been stopped.
 */
function messageForError(code: string): string | null {
  switch (code) {
    case "no-speech":
    case "aborted":
      return null;
    case "not-allowed":
      return MIC_DENIED_MESSAGE;
    case "service-not-allowed":
      return SERVICE_NOT_ALLOWED_MESSAGE;
    case "audio-capture":
      return MIC_FAILED_MESSAGE;
    case "network":
      return CONNECTION_FAILED_MESSAGE;
    case "language-not-supported":
      return LANGUAGE_NOT_SUPPORTED_MESSAGE;
    default:
      return RECOGNITION_FAILED_MESSAGE;
  }
}

function joinWords(...parts: string[]): string {
  return parts.filter(Boolean).join(" ").trim();
}
