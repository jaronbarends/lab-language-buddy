import styles from "./bubble.module.css";

type HighlightedTextProps = {
  text: string;
  spokenWordCount: number;
};

type TextToken = {
  text: string;
  tokenIsSpokenWord: boolean;
};

/**
 * Splits into words and the whitespace between them, marking which words count as
 * already spoken.
 *
 * Kept outside the component, and building the array up front rather than counting
 * inside a render callback: a running counter mutated from a closure during render
 * is exactly what the React Compiler's immutability rule flags, and it's a fair
 * complaint even when the map happens to be synchronous.
 *
 * The capturing group in the split keeps the whitespace as tokens, so the original
 * spacing and punctuation survive reassembly untouched.
 */
function tokenize(text: string, spokenWordCount: number): TextToken[] {
  const tokens: TextToken[] = [];
  let wordIndex = 0;

  for (const token of text.split(/(\s+)/)) {
    const tokenIsWhitespace = token.trim().length === 0;

    tokens.push({
      text: token,
      tokenIsSpokenWord: !tokenIsWhitespace && wordIndex < spokenWordCount,
    });

    if (!tokenIsWhitespace) {
      wordIndex += 1;
    }
  }

  return tokens;
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
      {tokenize(text, spokenWordCount).map((token, tokenIndex) => {
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
