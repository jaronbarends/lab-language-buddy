import { tokenizeText, type TextToken } from "@/lib/word-timing";

import styles from "./highlighted-text.module.css";

/**
 * Whether the whitespace between two spoken words is highlighted too, so the band is
 * continuous. Chosen deliberately; kept as a switch in case it is reconsidered. False
 * gives the earlier behaviour, where only the words are highlighted. The whitespace after
 * the last spoken word is never marked; it joins when the next word is spoken.
 */
const HIGHLIGHT_SPACES = true;

type HighlightedTextProps = {
  text: string;
  spokenWordCount: number;
};

/**
 * Splits into words and the whitespace between them, marking which words count as
 * already spoken, and, under HIGHLIGHT_SPACES, the whitespace between two spoken words.
 * What a word is comes from `tokenizeText`, shared with the timing code.
 *
 * Kept outside the component, and counting in a plain loop that builds the array up
 * front rather than in a render callback: a running counter mutated from a closure
 * during render is exactly what the React Compiler's immutability rule flags, and it's a
 * fair complaint even when the map happens to be synchronous. Here the counter is local
 * to the loop and nothing captures it.
 */
function markSpokenWords(
  text: string,
  spokenWordCount: number,
): (TextToken & { tokenIsSpokenWord: boolean })[] {
  let wordIndex = 0;
  const tokens = tokenizeText(text);
  const wordCount = tokens.filter((token) => token.tokenIsWord).length;

  const markedTokens: (TextToken & { tokenIsSpokenWord: boolean })[] = [];

  for (const token of tokens) {
    // For whitespace, `wordIndex` is the index of the word after it: spoken means the
    // whitespace has a spoken word on both sides. Under the flag only.
    const whitespaceIsBetweenSpokenWords =
      HIGHLIGHT_SPACES &&
      !token.tokenIsWord &&
      wordIndex >= 1 &&
      wordIndex < Math.min(spokenWordCount, wordCount);
    const tokenIsSpokenWord =
      whitespaceIsBetweenSpokenWords ||
      (token.tokenIsWord && wordIndex < spokenWordCount);

    if (token.tokenIsWord) {
      wordIndex += 1;
    }

    markedTokens.push({ ...token, tokenIsSpokenWord });
  }

  return markedTokens;
}

/**
 * Renders `text` with the first `spokenWordCount` words highlighted.
 *
 * Everything already spoken stays marked rather than only the current word — the
 * whole reply is visible from the start, and the growing band of colour shows how far
 * the reading has got.
 */
export function HighlightedText({
  text,
  spokenWordCount,
}: HighlightedTextProps) {
  return (
    <>
      {markSpokenWords(text, spokenWordCount).map((token, tokenIndex) => {
        if (!token.tokenIsSpokenWord) {
          return token.text;
        }

        return (
          <span key={tokenIndex} className={styles.spokenWord}>
            {token.text}
          </span>
        );
      })}
    </>
  );
}
