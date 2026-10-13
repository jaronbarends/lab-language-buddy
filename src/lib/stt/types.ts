import type { LanguageCode } from "@/lib/languages";
import type { LiveTranscript } from "@/lib/session-reducer";

/**
 * What a speech recognition engine reports back while it listens. The hook turns each of
 * these into a reducer action, so an engine knows nothing about the session state.
 */
export type SttCallbacks = {
  /** Audio is being captured from here on; words said before this are not heard. */
  onMicrophoneStarted(): void;
  onTranscript(transcript: LiveTranscript): void;
  /** The engine has already stopped itself when this is called. */
  onFailed(message: string, error: unknown): void;
};

/** Starts listening and returns the function that ends it. Safe to call twice. */
export type StartFunction = (language: LanguageCode, callbacks: SttCallbacks) => () => void;
