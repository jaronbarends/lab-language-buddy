import type { SynthesisInput, VoiceGender } from "./types";

// Multilingual, so `language` doesn't pick anything: one voice speaks every language.
const TTS_MODEL_ID = "eleven_flash_v2_5";

// when picking voices: default voices can be used with free plan.
// see all default voices here https://elevenlabs.io/app/voice-lab?voiceCategory=premade
const VOICE_IDS: Record<VoiceGender, string> = {
  female: "hpp4J3VqNfWAUOO0d1Us", // Bella
  male: "iP95p4xoKVk53GoZ742B", // Chris
};

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }
  return apiKey;
}

export async function synthesize(
  { text, gender }: SynthesisInput,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const apiKey = getApiKey();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[gender]}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, model_id: TTS_MODEL_ID }),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${await response.text()}`);
  }

  return response.arrayBuffer();
}
