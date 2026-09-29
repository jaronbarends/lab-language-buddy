export type WordTiming = {
  word: string;
  startTime: number;
};

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
 */
export function estimateWordTimings(
  text: string,
  durationSeconds: number,
): WordTiming[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

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

/** Word count used to drive the highlight; must agree with `estimateWordTimings`. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}
