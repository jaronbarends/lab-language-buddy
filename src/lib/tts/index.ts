import * as azure from "./azure";
import * as elevenlabs from "./elevenlabs";
import * as google from "./google";
import type { TtsProvider, VoiceGender } from "./types";

// Deepgram is STT-only here (its TTS has no Norwegian voice), so it isn't in this map.
const PROVIDERS = { azure, google, elevenlabs } satisfies Record<
  string,
  TtsProvider
>;

type ProviderName = keyof typeof PROVIDERS;

const DEFAULT_PROVIDER: ProviderName = "azure";

/**
 * Which voice every provider uses. One value for the whole app for now; a per-user
 * option later means putting `gender` in the request and passing it on from the route,
 * since the providers already take it as input.
 */
export const VOICE_GENDER: VoiceGender = "female";

/**
 * Chosen by `TTS_PROVIDER`; switching it is the only change needed. An unknown value
 * throws with the valid names rather than falling back, so a typo can't quietly leave
 * the app on a different provider than the one that was asked for.
 */
export function getTtsProvider(): TtsProvider {
  const configured = process.env.TTS_PROVIDER;
  if (!configured) {
    return PROVIDERS[DEFAULT_PROVIDER];
  }

  if (!(configured in PROVIDERS)) {
    throw new Error(
      `Unknown TTS_PROVIDER "${configured}" — expected one of: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }

  return PROVIDERS[configured as ProviderName];
}
