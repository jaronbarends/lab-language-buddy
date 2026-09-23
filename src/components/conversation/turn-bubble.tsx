import type { Turn } from "@/lib/session-reducer";

import { HighlightedText } from "./highlighted-text";
import styles from "./bubble.module.css";

type TurnBubbleProps = {
  turn: Turn;
  /** Non-null only for the turn currently being read aloud. */
  spokenWordCount: number | null;
};

export function TurnBubble({ turn, spokenWordCount }: TurnBubbleProps) {
  const authorStyle = turn.author === "ai" ? styles.ai : styles.user;
  const turnIsBeingSpoken = spokenWordCount !== null;

  return (
    <p className={`${styles.bubble} ${authorStyle}`}>
      {turnIsBeingSpoken ? (
        <HighlightedText text={turn.text} spokenWordCount={spokenWordCount} />
      ) : (
        turn.text
      )}
    </p>
  );
}
