"use client";

import { useEffect, type Dispatch } from "react";
import { z } from "zod";

import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import {
  turnStateIs,
  type SessionAction,
  type SessionState,
} from "@/lib/session-reducer";

const DEEPGRAM_LISTEN_URL = "wss://api.deepgram.com/v1/listen";

// Don't "upgrade" this without re-checking the languages: Norwegian exists only in the
// nova-2 model family, not in nova-3 or flux (see the note in src/lib/languages.ts).
const DEEPGRAM_MODEL = "nova-2";

// Chrome records webm/opus by default, Safari before 18.4 mp4/aac. Ask for webm/opus
// explicitly; if the browser can't do it, fall back to its own default and check below
// what it actually gave us.
const PREFERRED_RECORDING_MIME_TYPE = "audio/webm;codecs=opus";

/** How often MediaRecorder hands over a chunk, which is how often one goes to Deepgram. */
const CHUNK_INTERVAL_MS = 250;

const MIC_DENIED_MESSAGE =
  "Microphone access was denied. Allow it in your browser settings and try again.";
const MIC_FAILED_MESSAGE = "The microphone couldn't be started.";
const CONNECTION_FAILED_MESSAGE = "The connection to speech recognition failed.";

const AccessTokenSchema = z.object({ accessToken: z.string().min(1) });

// Only the part of a Deepgram `Results` message the app reads. Other message types
// (Metadata, UtteranceEnd, ...) fail the parse and are ignored.
const ResultsMessageSchema = z.object({
  type: z.literal("Results"),
  is_final: z.boolean(),
  channel: z.object({
    alternatives: z.array(z.object({ transcript: z.string() })).min(1),
  }),
});

/**
 * The microphone and the Deepgram socket: while the turn state is `listening`, audio goes
 * out and `TRANSCRIPT_UPDATED` comes back, or `FAILED` if any step breaks.
 *
 * Leaving `listening` (Send, Edit, Cancel, a failure) ends all of it in the effect
 * cleanup: handlers are detached before the socket closes, so nothing can arrive after
 * the state was left (the reducer's contract for async sources). Whatever Deepgram has not
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

    // function call to startLiveTranscription returns stop function that is
    // defined within startLiveTranscription. stop function is the effect cleanup.
    return startLiveTranscription(language, dispatch);
  }, [turnStateIsListening, language, dispatch]);
}

/** Starts listening and returns the function that ends it. Safe to call it twice. */
function startLiveTranscription(
  language: LanguageCode,
  dispatch: Dispatch<SessionAction>,
): () => void {
  let hasEnded = false;
  let stream: MediaStream | null = null;
  let socket: WebSocket | null = null;
  let recorder: MediaRecorder | null = null;

  function stop() {
    hasEnded = true;

    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
  }

  function fail(message: string, error: unknown) {
    if (hasEnded) {
      return;
    }

    console.error(error);
    stop();
    dispatch({
      type: "FAILED",
      message,
      detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  }

  async function connect() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const permissionWasDenied =
        error instanceof DOMException && error.name === "NotAllowedError";
      fail(permissionWasDenied ? MIC_DENIED_MESSAGE : MIC_FAILED_MESSAGE, error);
      return;
    }
    if (hasEnded) {
      // Left `listening` while the permission prompt was open; the stream arrived late.
      stop();
      return;
    }

    let accessToken: string;
    try {
      accessToken = await fetchAccessToken();
    } catch (error) {
      fail(CONNECTION_FAILED_MESSAGE, error);
      return;
    }
    if (hasEnded) {
      stop();
      return;
    }

    openSocket(accessToken);
  }

  function openSocket(accessToken: string) {
    const url = new URL(DEEPGRAM_LISTEN_URL);
    url.searchParams.set("model", DEEPGRAM_MODEL);
    url.searchParams.set("language", LANGUAGES[language].deepgram);
    url.searchParams.set("interim_results", "true");
    // No `encoding` or `sample_rate`: Deepgram reads the container header of the
    // webm/opus stream itself.

    // Browsers can't set an Authorization header on a WebSocket handshake, so the token
    // travels in the Sec-WebSocket-Protocol subprotocol. 'Bearer' for this short-lived
    // token; 'token' (which also works for the permanent key) is refused with a bare 401.
    const newSocket = new WebSocket(url, ["Bearer", accessToken]);
    socket = newSocket;

    let finalized = "";

    newSocket.onopen = () => startRecording(newSocket);

    newSocket.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseResultsMessage(event.data);
      if (!message) {
        return;
      }

      const transcript = message.channel.alternatives[0].transcript;
      if (!transcript) {
        return;
      }

      if (message.is_final) {
        finalized = `${finalized} ${transcript}`.trim();
        dispatch({
          type: "TRANSCRIPT_UPDATED",
          transcript: { finalized, interim: "" },
        });
        return;
      }

      dispatch({
        type: "TRANSCRIPT_UPDATED",
        transcript: { finalized, interim: transcript },
      });
    };

    // Either of these while we are still listening means the connection is gone: a
    // deliberate close from `stop()` has detached both handlers already.
    newSocket.onerror = () => fail(CONNECTION_FAILED_MESSAGE, new Error("Socket error"));
    newSocket.onclose = (event) =>
      fail(
        CONNECTION_FAILED_MESSAGE,
        new Error(`Socket closed (${event.code}) ${event.reason}`.trim()),
      );
  }

  function startRecording(liveSocket: WebSocket) {
    if (!stream) {
      return;
    }

    const newRecorder = new MediaRecorder(
      stream,
      MediaRecorder.isTypeSupported(PREFERRED_RECORDING_MIME_TYPE)
        ? { mimeType: PREFERRED_RECORDING_MIME_TYPE }
        : undefined,
    );
    recorder = newRecorder;

    newRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0 && liveSocket.readyState === WebSocket.OPEN) {
        liveSocket.send(event.data);
      }
    };

    newRecorder.start(CHUNK_INTERVAL_MS);

    // Only the real type is known after `start()`. Deepgram's streaming endpoint takes
    // webm/opus and ogg/opus; Safari's mp4/aac (before 18.4) it would swallow without
    // an error, so refuse it here rather than listen to nothing.
    if (!recordingFormatIsStreamable(newRecorder.mimeType)) {
      fail(
        MIC_FAILED_MESSAGE,
        new Error(`Unsupported recording format: ${newRecorder.mimeType}`),
      );
    }
  }

  // Deliberately not awaited: the caller needs `stop` straight away, to use as the
  // effect cleanup, while the connection is still being set up. `connect` handles its
  // own errors, so nothing is left unhandled.
  void connect();

  return stop;
}

async function fetchAccessToken(): Promise<string> {
  const response = await fetch("/api/stt/token", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Token request failed with status ${response.status}`);
  }

  return AccessTokenSchema.parse(await response.json()).accessToken;
}

function recordingFormatIsStreamable(mimeType: string): boolean {
  return mimeType.startsWith("audio/webm") || mimeType.startsWith("audio/ogg");
}

function parseResultsMessage(data: unknown) {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = ResultsMessageSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
