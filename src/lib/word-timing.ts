export type WordTiming = {
  word: string;
  startTime: number;
};

export type TextToken = { text: string; tokenIsWord: boolean };

/**
 * The one definition of "what is a word": a maximal run of non-whitespace. Everything
 * that counts, times or highlights words goes through here, so they can't drift apart.
 *
 * The capturing group in the split keeps the whitespace as tokens, so the original
 * spacing and punctuation survive reassembly untouched. Empty strings from leading or
 * trailing whitespace are dropped.
 */
export function tokenizeText(text: string): TextToken[] {
  return text
    .split(/(\s+)/)
    .filter((token) => token.length > 0)
    .map((token) => ({ text: token, tokenIsWord: token.trim().length > 0 }));
}

export function splitWords(text: string): string[] {
  return tokenizeText(text)
    .filter((token) => token.tokenIsWord)
    .map((token) => token.text);
}

/**
 * Spreads an audio clip's duration across its words in proportion to their character
 * length.
 *
 * This is an estimate and stays one. None of the three TTS providers gives us real
 * per-word timing over the REST calls we use: Azure only exposes word boundaries
 * through the full Speech SDK, and Google's Chirp3-HD voices silently ignore SSML
 * `<mark>` (HTTP 200, audio back, empty `timepoints` — verified in the spike).
 * ElevenLabs does have a `/with-timestamps` endpoint, but the highlight has to behave
 * identically whichever provider is configured, so we don't special-case it.
 *
 * Known limitation, accepted: no allowance for pauses after punctuation or for how
 * long a word actually takes to say, so short function words drift noticeably ahead
 * of or behind the audio. Judged good enough by ear.
 *
 * Precondition: `durationSeconds` must be finite and not negative. Safari can report
 * `NaN` or `Infinity` for `audio.duration` until the duration is known, and that
 * would turn every start time into `NaN` — `countSpokenWords` would then stop at the
 * first word and the highlight would silently never advance. So this throws instead:
 * the caller has to wait until the audio's duration is known (finite) before calling.
 */
export function estimateWordTimings(
  text: string,
  durationSeconds: number,
): WordTiming[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    throw new RangeError(
      `estimateWordTimings needs a finite, non-negative duration, got ${durationSeconds}. ` +
        "Wait until the audio's duration is known before calling.",
    );
  }

  const words = splitWords(text);

  if (words.length === 0) {
    return [];
  }

  // +1 per gap, so the spaces the speaker "uses up" are part of the budget.
  const totalCharacters =
    words.reduce((sum, word) => sum + word.length, 0) + (words.length - 1);

  let charactersSoFar = 0;
  return words.map((word) => {
    const startTime = (charactersSoFar / totalCharacters) * durationSeconds;
    charactersSoFar += word.length + 1;
    return { word, startTime };
  });
}

/** How many words, from the start, count as spoken at `currentTime`. */
export function countSpokenWords(
  wordTimings: WordTiming[],
  currentTime: number,
): number {
  let spokenWordCount = 0;

  for (const timing of wordTimings) {
    const wordHasStarted = timing.startTime <= currentTime;
    if (!wordHasStarted) {
      break;
    }
    spokenWordCount += 1;
  }

  return spokenWordCount;
}

/**
 * Word count used to drive the highlight. Agrees with `estimateWordTimings` and
 * `HighlightedText` by construction: all three build on `tokenizeText`.
 */
export function countWords(text: string): number {
  return splitWords(text).length;
}
