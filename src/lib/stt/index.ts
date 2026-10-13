import { startDeepgramTranscription } from "./deepgram";
import { startNativeTranscription } from "./native";
import type { StartFunction } from "./types";

const ENGINES = {
  native: startNativeTranscription,
  deepgram: startDeepgramTranscription,
} satisfies Record<string, StartFunction>;

type EngineName = keyof typeof ENGINES;

const DEFAULT_ENGINE: EngineName = "native";

function isEngineName(value: string): value is EngineName {
  return Object.hasOwn(ENGINES, value);
}

/**
 * Chosen by `NEXT_PUBLIC_STT_PROVIDER`; switching it is the only change needed. An unset
 * or empty value gives the default. An unknown one throws with the valid names rather
 * than falling back, so a typo can't quietly leave the app on a different engine than
 * the one that was asked for.
 *
 * Unlike `TTS_PROVIDER` this is read in the browser, so it has to be a `NEXT_PUBLIC_`
 * variable, read as a literal property so Next can inline it at build time.
 */
export function getConfiguredStartFunction(): StartFunction {
  const configuredProvider = process.env.NEXT_PUBLIC_STT_PROVIDER;
  if (!configuredProvider) {
    return ENGINES[DEFAULT_ENGINE];
  }

  if (!isEngineName(configuredProvider)) {
    throw new Error(
      `Unknown NEXT_PUBLIC_STT_PROVIDER "${configuredProvider}" — expected one of: ${Object.keys(ENGINES).join(", ")}`,
    );
  }

  return ENGINES[configuredProvider];
}
