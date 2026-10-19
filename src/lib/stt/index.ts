import { startDeepgramTranscription } from "./deepgram";
import { startElevenLabsTranscription } from "./elevenlabs";
import { startNativeTranscription } from "./native";
import type { StartFunction } from "./types";

const PROVIDER_START_FUNCTIONS = {
  native: startNativeTranscription,
  deepgram: startDeepgramTranscription,
  elevenlabs: startElevenLabsTranscription,
} satisfies Record<string, StartFunction>;

type ProviderName = keyof typeof PROVIDER_START_FUNCTIONS;

const DEFAULT_PROVIDER: ProviderName = "native";

function isProviderName(value: string): value is ProviderName {
  return Object.hasOwn(PROVIDER_START_FUNCTIONS, value);
}

/**
 * Chosen by `NEXT_PUBLIC_STT_PROVIDER`; switching it is the only change needed. An unset
 * or empty value gives the default. An unknown one throws with the valid names rather
 * than falling back, so a typo can't quietly leave the app on a different provider than
 * the one that was asked for.
 *
 * Unlike `TTS_PROVIDER` this is read in the browser, so it has to be a `NEXT_PUBLIC_`
 * variable, read as a literal property so Next can inline it at build time.
 */
export function getConfiguredStartFunction(): StartFunction {
  const configuredProvider = process.env.NEXT_PUBLIC_STT_PROVIDER;
  if (!configuredProvider) {
    return PROVIDER_START_FUNCTIONS[DEFAULT_PROVIDER];
  }

  if (!isProviderName(configuredProvider)) {
    const validNames = Object.keys(PROVIDER_START_FUNCTIONS).join(", ");
    throw new Error(
      `Unknown NEXT_PUBLIC_STT_PROVIDER "${configuredProvider}" — expected one of: ${validNames}`,
    );
  }

  return PROVIDER_START_FUNCTIONS[configuredProvider];
}
