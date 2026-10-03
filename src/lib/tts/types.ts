import { z } from "zod";

import { LANGUAGE_CODES, type LanguageCode } from "@/lib/languages";

/**
 * Characters, not words. Far beyond a single AI turn (two to four sentences); it is only
 * there so the public endpoint can't be fed unbounded text on the providers' tab.
 */
const MAX_TEXT_LENGTH = 2000;

/**
 * The contract of `/api/tts`. `language` is an enum because it selects the voice; the
 * voice gender is not part of it, since the server decides that (see `VOICE_GENDER`).
 */
export const TtsRequestSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  language: z.enum(LANGUAGE_CODES),
});

export type TtsRequest = z.infer<typeof TtsRequestSchema>;

export type VoiceGender = "female" | "male";

export type SynthesisInput = {
  text: string;
  language: LanguageCode;
  gender: VoiceGender;
};

/**
 * What every provider module exports. Each one resolves `language` and `gender` to a
 * voice inside itself, so nothing outside the module knows what a voice is called.
 * Resolves to MP3 bytes. `signal` is the request's, so a client that gave up stops the
 * paid call.
 */
export type TtsProvider = {
  synthesize(input: SynthesisInput, signal: AbortSignal): Promise<ArrayBuffer>;
};

/** "nb-NO-FinnNeural" and "nb-NO-Chirp3-HD-Aoede" both start with their locale. */
export function localeOfVoice(voiceName: string): string {
  return voiceName.split("-").slice(0, 2).join("-");
}
