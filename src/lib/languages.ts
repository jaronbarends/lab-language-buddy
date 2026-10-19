export const LANGUAGE_CODES = ["nl", "fr", "de", "it", "no", "es"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

type Language = {
  code: LanguageCode;
  /** Shown in the setup screen's picker. */
  label: string;
  /** How the language is named to Gemini in the system instruction. */
  promptName: string;
  /** Deepgram's `language` query param for the nova-2 model. */
  deepgramLang: string;
  /**
   * ElevenLabs Scribe's `language_code` (ISO 639-3). All six were tried against the live API
   * on 2026-10-19, by ear and without a count of errors (decision log, docs/plan.md, 10-16
   * row).
   */
  elevenLabsLang: string;
  /**
   * BCP 47 tag for the browser's `SpeechRecognition.lang`. With a region, unlike
   * `htmlLang`: Chrome and Safari want `nb-NO`, not `nb`.
   */
  webSpeechLang: string;
  /** BCP 47 tag for the `lang` attribute; separate from the two vendor values above. */
  htmlLang: string;
};

// Flags deliberately aren't here — see src/components/ui/flag-icon.tsx. They're a
// rendering concern, and a language code isn't a country code.

// Provider-neutral on purpose: this table is imported by the client, so it holds
// nothing a TTS vendor cares about. Each provider keeps its own voice table keyed
// by `code` — see src/lib/tts/. ElevenLabs needs no such table at all (its model is
// multilingual), which is precisely why voices don't belong here.
//
// When adding a language, check that every speech-to-text provider (Deepgram's model, the
// browser's SpeechRecognition, ElevenLabs' Scribe) and every TTS provider supports it; the
// TTS voices live in src/lib/tts/. Example: Norwegian exists only in Deepgram's nova-2
// family, not in nova-3 or flux.
export const LANGUAGES: Record<LanguageCode, Language> = {
  nl: {
    code: "nl",
    label: "Dutch",
    promptName: "Dutch",
    deepgramLang: "nl",
    elevenLabsLang: "nld",
    webSpeechLang: "nl-NL",
    htmlLang: "nl",
  },
  fr: {
    code: "fr",
    label: "French",
    promptName: "French",
    deepgramLang: "fr",
    elevenLabsLang: "fra",
    webSpeechLang: "fr-FR",
    htmlLang: "fr",
  },
  de: {
    code: "de",
    label: "German",
    promptName: "German",
    deepgramLang: "de",
    elevenLabsLang: "deu",
    webSpeechLang: "de-DE",
    htmlLang: "de",
  },
  it: {
    code: "it",
    label: "Italian",
    promptName: "Italian",
    deepgramLang: "it",
    elevenLabsLang: "ita",
    webSpeechLang: "it-IT",
    htmlLang: "it",
  },
  no: {
    code: "no",
    label: "Norwegian",
    promptName: "Norwegian (Bokmål)",
    deepgramLang: "no",
    elevenLabsLang: "nor",
    webSpeechLang: "nb-NO",
    htmlLang: "nb",
  },
  es: {
    code: "es",
    label: "Spanish",
    promptName: "Spanish",
    deepgramLang: "es",
    elevenLabsLang: "spa",
    webSpeechLang: "es-ES",
    htmlLang: "es",
  },
};

export const LANGUAGE_LIST = LANGUAGE_CODES.map((code) => LANGUAGES[code]);
