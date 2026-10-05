import type { LanguageCode } from "@/lib/languages";

import {
  localeOfVoice,
  type SynthesisInput,
  type VoiceGender,
} from "./types";

const TTS_OUTPUT_FORMAT = "audio-24khz-96kbitrate-mono-mp3";

// Verified against the Azure voices list endpoint on 2026-10-03: every name below is a
// generally available (GA) Neural voice. The Dragon HD and MAI voices were left out on
// purpose: the HD ones don't exist for every language here, and the MAI ones are in
// preview. Norwegian is `nb-NO` in Azure's terms, not `no`.
const VOICES: Record<VoiceGender, Record<LanguageCode, string>> = {
  female: {
    nl: "nl-NL-FennaNeural",
    fr: "fr-FR-DeniseNeural",
    de: "de-DE-KatjaNeural",
    it: "it-IT-ElsaNeural",
    no: "nb-NO-PernilleNeural",
    es: "es-ES-ElviraNeural",
  },
  male: {
    nl: "nl-NL-MaartenNeural",
    fr: "fr-FR-HenriNeural",
    de: "de-DE-ConradNeural",
    it: "it-IT-DiegoNeural",
    no: "nb-NO-FinnNeural",
    es: "es-ES-AlvaroNeural",
  },
};

function getCredentials(): { apiKey: string; region: string } {
  const apiKey = process.env.AZURE_SPEECH_API_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!apiKey) {
    throw new Error("Missing AZURE_SPEECH_API_KEY");
  }
  if (!region) {
    throw new Error("Missing AZURE_SPEECH_REGION");
  }
  return { apiKey, region };
}

export async function synthesize(
  { text, language, gender }: SynthesisInput,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const { apiKey, region } = getCredentials();
  const voice = VOICES[gender][language];

  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const ssml = `<speak version="1.0" xml:lang="${localeOfVoice(voice)}"><voice name="${voice}">${escapedText}</voice></speak>`;

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": TTS_OUTPUT_FORMAT,
        "User-Agent": "language-buddy",
      },
      body: ssml,
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Azure TTS failed (${response.status}): ${await response.text()}`);
  }

  return response.arrayBuffer();
}
