"use client";

// Throwaway spike page: Deepgram live streaming and ElevenLabs Scribe v2 Realtime next to
// the browser's native speech recognition, fed by the same microphone at the same moment.
// Not part of the app; it goes when the comparison is done. Reached by typing
// /stt-compare, nothing links here.

import { useEffect, useRef, useState } from "react";
import { z } from "zod";

// The spike has no language registry (that lives in the app's src/lib/languages.ts), so
// the tags per language are listed here. Chrome and Safari want a region for the
// native engine (nb-NO); the app's own `htmlLang` for Norwegian is just "nb". Scribe's docs
// list three-letter codes ("Norwegian (nor)").
const LANGUAGES = {
  no: { label: "Norwegian", deepgram: "no", native: "nb-NO", scribe: "nor" },
  nl: { label: "Dutch", deepgram: "nl", native: "nl-NL", scribe: "nld" },
  fr: { label: "French", deepgram: "fr", native: "fr-FR", scribe: "fra" },
  de: { label: "German", deepgram: "de", native: "de-DE", scribe: "deu" },
  it: { label: "Italian", deepgram: "it", native: "it-IT", scribe: "ita" },
  es: { label: "Spanish", deepgram: "es", native: "es-ES", scribe: "spa" },
} as const;

type LanguageCode = keyof typeof LANGUAGES;
const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

const ENGINES = ["deepgram", "scribe", "native"] as const;
type EngineName = (typeof ENGINES)[number];
type EngineStatus = "idle" | "starting" | "listening" | "ended" | "error" | "stopped";

type EngineView = {
  status: EngineStatus;
  finalized: string;
  interim: string;
  /** Click on Start until the first words (interim or final) came back. */
  firstWordsAfterMs: number | null;
  note: string;
};

type EngineCallbacks = {
  onListening(): void;
  onTranscript(finalized: string, interim: string): void;
  onEnded(note: string): void;
  onError(message: string): void;
};

const EMPTY_VIEW: EngineView = {
  status: "idle",
  finalized: "",
  interim: "",
  firstWordsAfterMs: null,
  note: "",
};

const ENGINE_LABELS: Record<EngineName, string> = {
  deepgram: "Deepgram nova-2 (live)",
  scribe: "ElevenLabs Scribe v2 Realtime",
  native: "Native SpeechRecognition",
};

function emptyViews(): Record<EngineName, EngineView> {
  return { deepgram: EMPTY_VIEW, scribe: EMPTY_VIEW, native: EMPTY_VIEW };
}

// Same values as src/hooks/use-live-transcription.ts.
const DEEPGRAM_LISTEN_URL = "wss://api.deepgram.com/v1/listen";
const DEEPGRAM_MODEL = "nova-2";
const PREFERRED_RECORDING_MIME_TYPE = "audio/webm;codecs=opus";
const CHUNK_INTERVAL_MS = 250;

const SCRIBE_LISTEN_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const SCRIBE_MODEL = "scribe_v2_realtime";
// Scribe takes only raw PCM (or u-law), not the WebM/Opus that MediaRecorder gives, so the
// audio comes from an AudioWorklet that downsamples to this rate.
const SCRIBE_SAMPLE_RATE = 16000;
const SCRIBE_CHUNK_SAMPLES = 1600; // 100 ms

// Runs on the audio thread. Averages the input down to SCRIBE_SAMPLE_RATE (a box filter,
// so the ratio need not be a whole number) and posts 16-bit PCM in chunks.
const PCM_WORKLET_SOURCE = `
class PcmDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${SCRIBE_SAMPLE_RATE};
    this.phase = 0;
    this.sum = 0;
    this.count = 0;
    this.out = new Int16Array(${SCRIBE_CHUNK_SAMPLES});
    this.outLength = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) {
      return true;
    }
    for (let i = 0; i < channel.length; i++) {
      this.sum += channel[i];
      this.count++;
      this.phase++;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const sample = Math.max(-1, Math.min(1, this.sum / this.count));
        this.out[this.outLength++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        this.sum = 0;
        this.count = 0;
        if (this.outLength === this.out.length) {
          this.port.postMessage(this.out.buffer, [this.out.buffer]);
          this.out = new Int16Array(${SCRIBE_CHUNK_SAMPLES});
          this.outLength = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm-downsampler", PcmDownsampler);
`;

const AccessTokenSchema = z.object({ accessToken: z.string().min(1) });
const ScribeTokenSchema = z.object({ token: z.string().min(1) });
// Only message_type and the fields this page reads; anything else on the message is ignored.
const ScribeMessageSchema = z.object({
  message_type: z.string(),
  text: z.string().optional(),
  error: z.string().optional(),
});
const ResultsMessageSchema = z.object({
  type: z.literal("Results"),
  is_final: z.boolean(),
  channel: z.object({
    alternatives: z.array(z.object({ transcript: z.string() })).min(1),
  }),
});

// lib.dom declares the SpeechRecognition result types, but not SpeechRecognition itself or
// its event, so those are declared here. The `*Like` types only contain the members this
// page uses.
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export default function Page() {
  const [languageCode, setLanguageCode] = useState<LanguageCode>("no");
  const [views, setViews] = useState<Record<EngineName, EngineView>>(emptyViews);
  // Never reassigned, only mutated: the unmount cleanup below relies on that.
  const stops = useRef<Partial<Record<EngineName, () => void>>>({});
  const startedAt = useRef<Partial<Record<EngineName, number>>>({});

  // The app's pattern: a tap only sets state, and the engine starts in an effect after the
  // render, like use-live-transcription does when the turn state becomes `listening`.
  // Whether iOS lets the native engine start from there is what the "Native via effect"
  // button tests; the other buttons start it straight from the tap. A counter and not a
  // flag: tapping the button while it is already on has to run the effect again, and 0 is
  // off.
  const [effectStartRun, setEffectStartRun] = useState(0);

  useEffect(() => {
    const stopsByEngine = stops.current;
    return () => {
      Object.values(stopsByEngine).forEach((stop) => stop?.());
    };
  }, []);

  useEffect(() => {
    if (effectStartRun === 0) {
      return;
    }

    const stopsByEngine = stops.current;
    startEngine("native");
    const startedStop = stopsByEngine.native;
    return () => {
      // Only the engine this effect started: a tap on a Start button has already stopped
      // it, and may have put a newer one in its place, by the time this cleanup runs.
      if (stopsByEngine.native === startedStop) {
        startedStop?.();
        delete stopsByEngine.native;
      }
    };
    // startEngine is recreated every render; this effect has to run only on the counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectStartRun]);

  function updateView(engine: EngineName, patch: Partial<EngineView>) {
    setViews((previous) => ({
      ...previous,
      [engine]: { ...previous[engine], ...patch },
    }));
  }

  // Also marks the panels of what it stops, so one that is not started again straight
  // away (the other engine, when a Start button starts only one) does not keep saying it
  // is listening.
  function stopAll() {
    for (const engine of ENGINES) {
      stops.current[engine]?.();
      delete stops.current[engine];
    }
    setViews((previous) => ({
      deepgram: stoppedView(previous.deepgram),
      scribe: stoppedView(previous.scribe),
      native: stoppedView(previous.native),
    }));
  }

  function startEngine(engine: EngineName) {
    startedAt.current[engine] = performance.now();
    updateView(engine, { ...EMPTY_VIEW, status: "starting" });

    // An ended or failed engine must not overwrite a later status, and a status change
    // after Stop is ignored.
    function settle(status: "ended" | "error", note: string) {
      setViews((previous) => {
        const engineIsRunning =
          previous[engine].status === "starting" ||
          previous[engine].status === "listening";
        if (!engineIsRunning) {
          return previous;
        }
        return { ...previous, [engine]: { ...previous[engine], status, note } };
      });
    }

    const callbacks: EngineCallbacks = {
      onListening() {
        updateView(engine, { status: "listening" });
      },
      onTranscript(finalized, interim) {
        const start = startedAt.current[engine];
        setViews((previous) => {
          const firstWordsAfterMs =
            previous[engine].firstWordsAfterMs ??
            (start !== undefined && (finalized || interim)
              ? Math.round(performance.now() - start)
              : null);
          return {
            ...previous,
            [engine]: { ...previous[engine], finalized, interim, firstWordsAfterMs },
          };
        });
      },
      onEnded(note) {
        settle("ended", note);
      },
      onError(message) {
        settle("error", message);
      },
    };

    const language = LANGUAGES[languageCode];
    if (engine === "native") {
      stops.current[engine] = startNative(language.native, callbacks);
      return;
    }
    if (engine === "scribe") {
      stops.current[engine] = startScribe(language.scribe, callbacks);
      return;
    }
    stops.current[engine] = startDeepgram(language.deepgram, callbacks);
  }

  function handleStart(engines: EngineName[]) {
    setEffectStartRun(0);
    stopAll();
    // Native first, and with nothing awaited before it, so it starts inside the tap
    // itself. Starting from an effect also works on iOS ("Native via effect"); this is
    // just the plainest case to compare against.
    const ordered = (["native", "scribe", "deepgram"] as const).filter((engine) =>
      engines.includes(engine),
    );
    ordered.forEach(startEngine);
  }

  function handleStartNativeViaEffect() {
    stopAll();
    setEffectStartRun((run) => run + 1);
  }

  function handleStop() {
    setEffectStartRun(0);
    stopAll();
  }

  function handleReset() {
    setEffectStartRun(0);
    stopAll();
    setViews(emptyViews());
  }

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto", fontSize: 16 }}>
    <style>{`
      button {
        border: 1px solid;
        padding: 5px;
        background: white;
      }
      `}
    </style>
      <h1>STT comparison</h1>
      <p>
        All engines listen to the same microphone. If one of them stays silent or errors
        when they run together, play a recording while running each engine on its own.
      </p>

      <label>
        Language{" "}
        <select
          value={languageCode}
          onChange={(event) => setLanguageCode(event.target.value as LanguageCode)}
        >
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGES[code].label}
            </option>
          ))}
        </select>
      </label>
      <p>
        Native language tag: <code>{LANGUAGES[languageCode].native}</code>
        {" · "}
        Deepgram: <code>{LANGUAGES[languageCode].deepgram}</code>
        {" · "}
        Scribe: <code>{LANGUAGES[languageCode].scribe}</code>
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button onClick={() => handleStart([...ENGINES])}>Start all</button>
        <button onClick={() => handleStart(["deepgram"])}>Deepgram only</button>
        <button onClick={() => handleStart(["scribe"])}>Scribe only</button>
        <button onClick={() => handleStart(["native"])}>Native only</button>
        <button onClick={handleStartNativeViaEffect}>Native via effect</button>
        <button onClick={handleStop}>Stop</button>
        <button onClick={handleReset}>Clear</button>
      </div>

      {ENGINES.map((engine) => (
        <EnginePanel key={engine} name={ENGINE_LABELS[engine]} view={views[engine]} />
      ))}
    </main>
  );
}

function EnginePanel({ name, view }: { name: string; view: EngineView }) {
  return (
    <section style={{ border: "1px solid #888", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>{name}</h2>
      <p style={{ margin: "4px 0" }}>
        Status: <strong>{view.status}</strong>
        {view.firstWordsAfterMs !== null && ` · first words after ${view.firstWordsAfterMs} ms`}
        {view.note && ` · ${view.note}`}
      </p>
      <p style={{ minHeight: "3em", margin: 0 }}>
        {view.finalized}{" "}
        <span style={{ opacity: 0.55, fontStyle: "italic" }}>{view.interim}</span>
      </p>
    </section>
  );
}

function stoppedView(view: EngineView): EngineView {
  const engineIsRunning = view.status === "starting" || view.status === "listening";
  return engineIsRunning ? { ...view, status: "stopped" } : view;
}

/** Starts the native engine and returns the function that ends it. */
function startNative(lang: string, callbacks: EngineCallbacks): () => void {
  const speechWindow = window as unknown as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  if (!Recognition) {
    callbacks.onError("SpeechRecognition is not available in this browser");
    return () => {};
  }

  let hasEnded = false;
  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => callbacks.onListening();

  recognition.onresult = (event) => {
    // Rebuilt from the full result list each time rather than only the new entries, so
    // whatever the browser revises ends up on screen.
    let finalized = "";
    let interim = "";
    for (let index = 0; index < event.results.length; index++) {
      const result = event.results[index];
      if (result.isFinal) {
        finalized = `${finalized} ${result[0].transcript}`.trim();
      } else {
        interim = `${interim} ${result[0].transcript}`.trim();
      }
    }
    callbacks.onTranscript(finalized, interim);
  };

  recognition.onerror = (event) => callbacks.onError(`error: ${event.error}`);

  // Not restarted on purpose: when the browser ends the session by itself, that is part
  // of what this page should show.
  recognition.onend = () => {
    if (!hasEnded) {
      callbacks.onEnded("the browser ended the session");
    }
  };

  try {
    recognition.start();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : String(error));
  }

  return function stop() {
    hasEnded = true;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
  };
}

/** Starts the Deepgram stream and returns the function that ends it. */
function startDeepgram(language: string, callbacks: EngineCallbacks): () => void {
  let hasEnded = false;
  let stream: MediaStream | null = null;
  let socket: WebSocket | null = null;
  let recorder: MediaRecorder | null = null;

  function stop() {
    hasEnded = true;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstart = null;
      recorder.onerror = null;
      recorder.onstop = null;
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

  function fail(message: string) {
    if (hasEnded) {
      return;
    }
    stop();
    callbacks.onError(message);
  }

  async function connect() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (hasEnded) {
        stop();
        return;
      }

      const response = await fetch("/api/stt/token", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Token request failed with status ${response.status}`);
      }
      const { accessToken } = AccessTokenSchema.parse(await response.json());
      if (hasEnded) {
        stop();
        return;
      }

      openSocket(accessToken);
    } catch (error) {
      fail(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    }
  }

  function openSocket(accessToken: string) {
    const url = new URL(DEEPGRAM_LISTEN_URL);
    url.searchParams.set("model", DEEPGRAM_MODEL);
    url.searchParams.set("language", language);
    url.searchParams.set("interim_results", "true");

    const newSocket = new WebSocket(url, ["Bearer", accessToken]);
    socket = newSocket;
    let finalized = "";

    newSocket.onopen = () => startRecording(newSocket);

    newSocket.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseResultsMessage(event.data);
      const transcript = message?.channel.alternatives[0].transcript;
      if (!message || !transcript) {
        return;
      }

      if (message.is_final) {
        finalized = `${finalized} ${transcript}`.trim();
        callbacks.onTranscript(finalized, "");
        return;
      }
      callbacks.onTranscript(finalized, transcript);
    };

    newSocket.onerror = () => fail("Socket error");
    newSocket.onclose = (event) => fail(`Socket closed (${event.code}) ${event.reason}`.trim());
  }

  function startRecording(liveSocket: WebSocket) {
    if (!stream) {
      return;
    }

    try {
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

      newRecorder.onstart = () => {
        const mimeType = newRecorder.mimeType;
        if (!mimeType.startsWith("audio/webm") && !mimeType.startsWith("audio/ogg")) {
          fail(`Unsupported recording format: ${mimeType}`);
          return;
        }
        callbacks.onListening();
      };

      newRecorder.onerror = () => fail("Recorder error");
      newRecorder.onstop = () => fail("Recording stopped unexpectedly");

      newRecorder.start(CHUNK_INTERVAL_MS);
    } catch (error) {
      fail(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    }
  }

  void connect();

  return stop;
}

/** Starts the ElevenLabs Scribe v2 Realtime stream and returns the function that ends it. */
function startScribe(language: string, callbacks: EngineCallbacks): () => void {
  let hasEnded = false;
  let stream: MediaStream | null = null;
  let socket: WebSocket | null = null;
  let node: AudioWorkletNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;

  // Created inside the tap itself, before anything is awaited: Safari keeps an
  // AudioContext that is created later suspended.
  const context = new AudioContext();

  function stop() {
    hasEnded = true;
    if (node) {
      node.port.onmessage = null;
      node.disconnect();
    }
    source?.disconnect();
    void context.close().catch(() => {});
    stream?.getTracks().forEach((track) => track.stop());
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    }
  }

  function fail(message: string) {
    if (hasEnded) {
      return;
    }
    stop();
    callbacks.onError(message);
  }

  async function connect() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (hasEnded) {
        stop();
        return;
      }

      const response = await fetch("/api/stt/scribe-token", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Token request failed with status ${response.status}`);
      }
      const { token } = ScribeTokenSchema.parse(await response.json());
      if (hasEnded) {
        stop();
        return;
      }

      openSocket(token);
    } catch (error) {
      fail(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    }
  }

  function openSocket(token: string) {
    const url = new URL(SCRIBE_LISTEN_URL);
    url.searchParams.set("model_id", SCRIBE_MODEL);
    url.searchParams.set("language_code", language);
    url.searchParams.set("audio_format", `pcm_${SCRIBE_SAMPLE_RATE}`);
    // The server decides where a segment ends, the way Deepgram's is_final does.
    url.searchParams.set("commit_strategy", "vad");
    url.searchParams.set("token", token);

    const newSocket = new WebSocket(url);
    socket = newSocket;
    let finalized = "";

    newSocket.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseScribeMessage(event.data);
      if (!message) {
        return;
      }

      switch (message.message_type) {
        case "session_started":
          void startAudio(newSocket);
          return;
        case "partial_transcript":
          callbacks.onTranscript(finalized, message.text ?? "");
          return;
        case "committed_transcript":
          finalized = `${finalized} ${message.text ?? ""}`.trim();
          callbacks.onTranscript(finalized, "");
          return;
        default:
          if (message.message_type.includes("error") || message.error) {
            fail(`${message.message_type}: ${message.error ?? ""}`.trim());
            return;
          }
          // Not asked for and not understood: visible in the console, not on the page.
          console.debug("[scribe] unhandled message", message);
      }
    };

    newSocket.onerror = () => fail("Socket error");
    newSocket.onclose = (event) => fail(`Socket closed (${event.code}) ${event.reason}`.trim());
  }

  async function startAudio(liveSocket: WebSocket) {
    if (!stream) {
      return;
    }

    try {
      const workletUrl = URL.createObjectURL(
        new Blob([PCM_WORKLET_SOURCE], { type: "application/javascript" }),
      );
      await context.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);
      await context.resume();
      if (hasEnded) {
        return;
      }

      source = context.createMediaStreamSource(stream);
      node = new AudioWorkletNode(context, "pcm-downsampler");
      node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (liveSocket.readyState !== WebSocket.OPEN) {
          return;
        }
        liveSocket.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: arrayBufferToBase64(event.data),
            commit: false,
            sample_rate: SCRIBE_SAMPLE_RATE,
          }),
        );
      };
      // Browsers only run a node that has a path to the destination, so it goes through a
      // gain of 0: the microphone must not play out loud.
      const mute = context.createGain();
      mute.gain.value = 0;
      source.connect(node);
      node.connect(mute);
      mute.connect(context.destination);
      callbacks.onListening();
    } catch (error) {
      fail(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    }
  }

  void connect();

  return stop;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function parseScribeMessage(data: unknown) {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = ScribeMessageSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
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
