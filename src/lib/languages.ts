export const LANGUAGE_CODES = ["nl", "fr", "de", "it", "no", "es"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

type Language = {
  code: LanguageCode;
  /** Shown in the setup screen's picker. */
  label: string;
  /** How the language is named to Gemini in the system instruction. */
  promptName: string;
  /** Deepgram's `language` query param for the nova-2 model. */
  deepgram: string;
  /** BCP 47 tag for the `lang` attribute; separate from `deepgram`, which is a vendor param. */
  htmlLang: string;
};

// Flags deliberately aren't here — see src/components/ui/flag-icon.tsx. They're a
// rendering concern, and a language code isn't a country code.

// Provider-neutral on purpose: this table is imported by the client, so it holds
// nothing a TTS vendor cares about. Each provider keeps its own voice table keyed
// by `code` — see src/lib/tts/. ElevenLabs needs no such table at all (its model is
// multilingual), which is precisely why voices don't belong here.
//
// Note on Norwegian: nova-2 is the only Deepgram model family that supports it —
// nova-3 and flux do not. Don't "upgrade" the model without re-checking that.
export const LANGUAGES: Record<LanguageCode, Language> = {
  nl: {
    code: "nl",
    label: "Dutch",
    promptName: "Dutch",
    deepgram: "nl",
    htmlLang: "nl",
  },
  fr: {
    code: "fr",
    label: "French",
    promptName: "French",
    deepgram: "fr",
    htmlLang: "fr",
  },
  de: {
    code: "de",
    label: "German",
    promptName: "German",
    deepgram: "de",
    htmlLang: "de",
  },
  it: {
    code: "it",
    label: "Italian",
    promptName: "Italian",
    deepgram: "it",
    htmlLang: "it",
  },
  no: {
    code: "no",
    label: "Norwegian",
    promptName: "Norwegian (Bokmål)",
    deepgram: "no",
    htmlLang: "nb",
  },
  es: {
    code: "es",
    label: "Spanish",
    promptName: "Spanish",
    deepgram: "es",
    htmlLang: "es",
  },
};

export const LANGUAGE_LIST = LANGUAGE_CODES.map((code) => LANGUAGES[code]);
