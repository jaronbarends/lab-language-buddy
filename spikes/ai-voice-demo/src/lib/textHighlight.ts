export type WordTiming = {
  word: string;
  startTime: number;
};

// No real per-word timing from the TTS provider (see findings.md,
// "TTS-highlighting"), so this spreads the audio's total duration across
// words proportional to their character length. It's an estimate, not a
// transcript-accurate timing.
export function estimateWordTimings(text: string, durationSeconds: number): WordTiming[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return [];
  }

  const totalCharacters = words.reduce((sum, word) => sum + word.length, 0) + (words.length - 1);

  let charactersSoFar = 0;
  return words.map((word) => {
    const startTime = (charactersSoFar / totalCharacters) * durationSeconds;
    charactersSoFar += word.length + 1;
    return { word, startTime };
  });
}

// Given the current playback time, how many words (from the start) have
// been "spoken" according to the estimate.
export function countSpokenWords(wordTimings: WordTiming[], currentTime: number): number {
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
