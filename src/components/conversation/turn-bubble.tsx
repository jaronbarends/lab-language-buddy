import type { Turn } from "@/lib/session-reducer";

import { Bubble } from "./bubble";
import { EvaluationSection } from "./evaluation-section";
import { HighlightedText } from "./highlighted-text";
import styles from "./turn-bubble.module.css";

type TurnBubbleProps = {
  turn: Turn;
  /** Non-null only for the turn currently being read aloud. */
  spokenWordCount: number | null;
  conversationLang: string;
};

export function TurnBubble({
  turn,
  spokenWordCount,
  conversationLang,
}: TurnBubbleProps) {
  const turnIsBeingSpoken = spokenWordCount !== null;

  return (
    <Bubble author={turn.author}>
      <span className={styles.speakerLabel}>
        {turn.author === "ai" ? "AI: " : "You: "}
      </span>
      <p lang={conversationLang}>
        {turnIsBeingSpoken ? (
          <HighlightedText text={turn.text} spokenWordCount={spokenWordCount} />
        ) : (
          turn.text
        )}
      </p>
      {turn.author === "user" && (
        <EvaluationSection
          evaluation={turn.evaluation}
          conversationLang={conversationLang}
        />
      )}
    </Bubble>
  );
}
