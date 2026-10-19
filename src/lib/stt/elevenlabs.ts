import { z } from "zod";

import { LANGUAGES, type LanguageCode } from "@/lib/languages";

import {
  CONNECTION_FAILED_MESSAGE,
  MIC_DENIED_MESSAGE,
  MIC_FAILED_MESSAGE,
} from "./messages";
import {
  PCM_SAMPLE_RATE,
  PCM_WORKLET_NAME,
  PCM_WORKLET_SOURCE,
} from "./pcm-worklet";
import type { SttCallbacks } from "./types";

const ELEVENLABS_LISTEN_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const ELEVENLABS_MODEL = "scribe_v2_realtime";

/**
 * How long getting the microphone going may take once permission is granted: the token,
 * the socket, ElevenLabs' `session_started` and loading the worklet. Without a bound, a
 * hanging step would leave the screen waiting without any sign.
 */
const LIVE_CONNECT_TIMEOUT_MS = 10_000;

const MIC_STOPPED_MESSAGE = "The microphone stopped.";

const AccessTokenSchema = z.object({ accessToken: z.string().min(1) });

// Only the fields of a Scribe message the app reads. The socket also sends messages with
// timestamps, entities and so on when asked for; none are asked for.
const MessageSchema = z.object({
  message_type: z.string(),
  text: z.string().optional(),
  error: z.string().optional(),
});

// Message types that mean the session is over or unusable. `commit_throttled` and
// `warning` are left out: the app never commits by hand, and a warning is not fatal.
const ERROR_MESSAGE_TYPES = new Set([
  "auth_error",
  "quota_exceeded",
  "rate_limited",
  "session_time_limit_exceeded",
]);

/**
 * Starts the microphone and the ElevenLabs Scribe v2 Realtime socket and returns the
 * function that ends them. Safe to call it twice.
 *
 * Audio goes out as 16-bit PCM from an AudioWorklet and `onTranscript` comes back, or
 * `onFailed` if any step breaks. Stopping detaches the handlers before the socket closes,
 * so nothing can arrive after it (the reducer's contract for async sources). Whatever
 * Scribe has not yet committed at that moment is dropped; the transcript on screen,
 * interim words included, is what Send, Edit and Cancel act on.
 */
export function startElevenLabsTranscription(
  language: LanguageCode,
  callbacks: SttCallbacks,
): () => void {
  let hasEnded = false;
  let stream: MediaStream | null = null;
  let socket: WebSocket | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioWorkletNode | null = null;
  let mute: GainNode | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  // Aborted by stop(), so a cancelled or timed-out start does not leave a token request
  // running.
  const tokenRequest = new AbortController();

  // Created here, inside the tap that started the turn and before anything is awaited:
  // an AudioContext made later may stay suspended on iOS. A failure is reported from
  // `connect`, not from here: `onFailed` must not come before this function has returned.
  let context: AudioContext | null = null;
  let contextError: unknown = null;
  try {
    context = new AudioContext();
  } catch (error) {
    contextError = error;
  }

  function clearConnectTimer() {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  }

  function stop() {
    hasEnded = true;
    // After hasEnded: the abort rejects the token fetch, and fail() ignores that once ended.
    tokenRequest.abort();
    clearConnectTimer();

    if (node) {
      node.port.onmessage = null;
      node.onprocessorerror = null;
    }
    node?.disconnect();
    mute?.disconnect();
    source?.disconnect();
    void context?.close().catch(() => {});

    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });

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

    stop();
    callbacks.onFailed(message, error);
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
    if (!context) {
      fail(MIC_FAILED_MESSAGE, contextError);
      return;
    }

    // Started only now: time spent on the permission prompt must not count.
    connectTimer = setTimeout(() => {
      fail(
        CONNECTION_FAILED_MESSAGE,
        new DOMException("Timed out", "TimeoutError"),
      );
    }, LIVE_CONNECT_TIMEOUT_MS);

    let accessToken: string;
    try {
      accessToken = await fetchAccessToken(tokenRequest.signal);
    } catch (error) {
      fail(CONNECTION_FAILED_MESSAGE, error);
      return;
    }
    if (hasEnded) {
      stop();
      return;
    }

    // Constructing a WebSocket can throw synchronously; like every other step it ends in
    // a failure rather than in a rejection nobody handles.
    try {
      openSocket(accessToken);
    } catch (error) {
      fail(CONNECTION_FAILED_MESSAGE, error);
    }
  }

  function openSocket(accessToken: string) {
    const url = new URL(ELEVENLABS_LISTEN_URL);
    url.searchParams.set("model_id", ELEVENLABS_MODEL);
    url.searchParams.set("language_code", LANGUAGES[language].elevenLabsLang);
    url.searchParams.set("audio_format", `pcm_${PCM_SAMPLE_RATE}`);
    // Scribe decides where a segment ends, the way Deepgram's `is_final` does.
    url.searchParams.set("commit_strategy", "vad");
    // Browsers can't set a header on a WebSocket handshake, so the single-use token
    // travels in the query string.
    url.searchParams.set("token", accessToken);

    const newSocket = new WebSocket(url);
    socket = newSocket;

    let finalized = "";

    newSocket.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseMessage(event.data);
      if (!message) {
        return;
      }

      if (message.message_type === "session_started") {
        // Audio is sent only from here: before this the session does not accept it.
        void startStreamingAudio(newSocket);
        return;
      }

      if (message.message_type === "partial_transcript") {
        callbacks.onTranscript({ finalized, interim: message.text ?? "" });
        return;
      }

      if (message.message_type === "committed_transcript") {
        if (!message.text) {
          return;
        }

        finalized = `${finalized} ${message.text}`.trim();
        callbacks.onTranscript({ finalized, interim: "" });
        return;
      }

      if (
        ERROR_MESSAGE_TYPES.has(message.message_type) ||
        message.message_type.endsWith("error")
      ) {
        fail(
          CONNECTION_FAILED_MESSAGE,
          new Error(`${message.message_type}: ${message.error ?? ""}`.trim()),
        );
      }
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

  async function startStreamingAudio(liveSocket: WebSocket) {
    if (!stream || !context) {
      return;
    }

    try {
      const workletUrl = URL.createObjectURL(
        new Blob([PCM_WORKLET_SOURCE], { type: "application/javascript" }),
      );
      try {
        await context.audioWorklet.addModule(workletUrl);
      } finally {
        URL.revokeObjectURL(workletUrl);
      }
      await context.resume();
      if (hasEnded) {
        return;
      }

      source = context.createMediaStreamSource(stream);
      node = new AudioWorkletNode(context, PCM_WORKLET_NAME);
      node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (liveSocket.readyState !== WebSocket.OPEN) {
          return;
        }

        liveSocket.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: arrayBufferToBase64(event.data),
            commit: false,
            sample_rate: PCM_SAMPLE_RATE,
          }),
        );
      };
      node.onprocessorerror = () =>
        fail(MIC_STOPPED_MESSAGE, new Error("Audio worklet error"));

      // The track ends by itself when the microphone goes away (a headset unplugged, an
      // interruption by iOS). Our own cleanup does not get here: `stop()` detaches this
      // handler first.
      stream.getTracks().forEach((track) => {
        track.onended = () =>
          fail(MIC_STOPPED_MESSAGE, new Error("Microphone track ended"));
      });

      // Browsers only run a node that has a path to the destination, so it goes through a
      // gain of 0: the microphone must not play out loud.
      mute = context.createGain();
      mute.gain.value = 0;
      source.connect(node);
      node.connect(mute);
      mute.connect(context.destination);

      clearConnectTimer();
      callbacks.onMicrophoneStarted();
    } catch (error) {
      fail(MIC_FAILED_MESSAGE, error);
    }
  }

  // Deliberately not awaited: the caller needs `stop` straight away, to use as the
  // effect cleanup, while the connection is still being set up. `connect` handles its
  // own errors, so nothing is left unhandled.
  void connect();

  return stop;
}

async function fetchAccessToken(signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/stt/elevenlabs-token", { method: "POST", signal });
  if (!response.ok) {
    throw new Error(`Token request failed with status ${response.status}`);
  }

  return AccessTokenSchema.parse(await response.json()).accessToken;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function parseMessage(data: unknown) {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = MessageSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
