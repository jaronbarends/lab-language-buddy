import type { LanguageCode } from "@/lib/languages";
import type { LiveTranscript } from "@/lib/session-reducer";

/**
 * What a speech recognition provider reports back while it listens. The hook turns each of
 * these into a reducer action, so a provider knows nothing about the session state, only
 * the shape of a transcript, which the reducer owns (`LiveTranscript`).
 *
 * Every provider must follow these rules:
 * - Nothing is reported after `onFailed` or after the stop function was called.
 * - `onFailed` comes at most once, and only after the provider's engine has stopped itself.
 * - `onMicrophoneStarted` is reported once per start (the native engine reports only
 *   its first session).
 */
export type SttCallbacks = {
  /** Audio is being captured from here on; words said before this are not heard. */
  onMicrophoneStarted(): void;
  onTranscript(transcript: LiveTranscript): void;
  /** The provider's engine has already stopped itself when this is called. */
  onFailed(message: string, error: unknown): void;
};

/**
 * Starts listening and returns the function that ends it. Safe to call twice.
 *
 * The stop function detaches all of its handlers before it closes or aborts
 * anything, so nothing arrives after it has been called. The reducer cannot tell a stale
 * `TRANSCRIPT_UPDATED` from a current one (both only check the state name), so a late
 * transcript could land in the next `listening` turn. See "Contract for the async
 * drivers" on `sessionReducer` in `src/lib/session-reducer.ts`.
 */
export type StartFunction = (language: LanguageCode, callbacks: SttCallbacks) => () => void;
