import { tokenizeText, type TextToken } from "@/lib/word-timing";

import styles from "./bubble.module.css";

type HighlightedTextProps = {
  text: string;
  spokenWordCount: number;
};

/**
 * Splits into words and the whitespace between them, marking which words count as
 * already spoken. What a word is comes from `tokenizeText`, shared with the timing
 * code.
 *
 * Kept outside the component, and building the array up front rather than counting
 * inside a render callback: a running counter mutated from a closure during render
 * is exactly what the React Compiler's immutability rule flags, and it's a fair
 * complaint even when the map happens to be synchronous.
 */
function markSpokenWords(
  text: string,
  spokenWordCount: number,
): (TextToken & { tokenIsSpokenWord: boolean })[] {
  let wordIndex = 0;

  return tokenizeText(text).map((token) => {
    const tokenIsSpokenWord = token.tokenIsWord && wordIndex < spokenWordCount;

    if (token.tokenIsWord) {
      wordIndex += 1;
    }

    return { ...token, tokenIsSpokenWord };
  });
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
