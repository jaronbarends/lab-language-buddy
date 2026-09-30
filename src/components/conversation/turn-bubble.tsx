import type { Turn } from "@/lib/session-reducer";

import { Bubble } from "./bubble";
import { HighlightedText } from "./highlighted-text";
import styles from "./turn-bubble.module.css";

type TurnBubbleProps = {
  turn: Turn;
  /** Non-null only for the turn currently being read aloud. */
  spokenWordCount: number | null;
};

export function TurnBubble({ turn, spokenWordCount }: TurnBubbleProps) {
  const turnIsBeingSpoken = spokenWordCount !== null;

  return (
    <Bubble author={turn.author}>
      <span className={styles.speakerLabel}>
        {turn.author === "ai" ? "AI: " : "You: "}
      </span>
      {turnIsBeingSpoken ? (
        <HighlightedText text={turn.text} spokenWordCount={spokenWordCount} />
      ) : (
        turn.text
      )}
    </Bubble>
  );
}
