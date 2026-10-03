import type { LanguageCode } from "@/lib/languages";

import {
  localeOfVoice,
  type SynthesisInput,
  type VoiceGender,
} from "./types";

// range 0.25-2.0, 1.0 is unadjusted pace
const SPEAKING_RATE = 1;

// Verified against Google's voices list endpoint on 2026-10-03. Chirp3-HD voices are
// named after a star, and the same name exists in every language here, so these are the
// same two names per locale. Written out in full anyway: a name that quietly stops
// existing in one language should be a one-line edit, not a derived string to hunt for.
// Norwegian is `nb-NO` in Google's terms, not `no`.
const VOICES: Record<VoiceGender, Record<LanguageCode, string>> = {
  female: {
    nl: "nl-NL-Chirp3-HD-Aoede",
    fr: "fr-FR-Chirp3-HD-Aoede",
    de: "de-DE-Chirp3-HD-Aoede",
    it: "it-IT-Chirp3-HD-Aoede",
    no: "nb-NO-Chirp3-HD-Aoede",
    es: "es-ES-Chirp3-HD-Aoede",
  },
  male: {
    nl: "nl-NL-Chirp3-HD-Charon",
    fr: "fr-FR-Chirp3-HD-Charon",
    de: "de-DE-Chirp3-HD-Charon",
    it: "it-IT-Chirp3-HD-Charon",
    no: "nb-NO-Chirp3-HD-Charon",
    es: "es-ES-Chirp3-HD-Charon",
  },
};

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_CLOUD_API_KEY");
  }
  return apiKey;
}

export async function synthesize(
  { text, language, gender }: SynthesisInput,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  const voice = VOICES[gender][language];

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: localeOfVoice(voice), name: voice },
        audioConfig: { audioEncoding: "MP3", speakingRate: SPEAKING_RATE },
      }),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Google TTS failed (${response.status}): ${await response.text()}`);
  }

  const data: { audioContent: string } = await response.json();
  // The slice is needed: a Node Buffer can be a view into a shared pool, so its
  // underlying ArrayBuffer is larger than the audio and starts at an offset.
  const buffer = Buffer.from(data.audioContent, "base64");
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}
