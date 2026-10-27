import type { Turn } from "@/lib/session-reducer";

import { Bubble } from "./bubble";
import revealStyles from "./bubble-reveal.module.css";
import { EvaluationSection } from "./evaluation-section";
import { HighlightedText } from "./highlighted-text";
import styles from "./turn-bubble.module.css";

type TurnBubbleProps = {
  turn: Turn;
  /** Non-null only for the turn currently being read aloud. */
  spokenWordCount: number | null;
  conversationLang: string;
  /**
   * Grow the bubble in (JNL-003, K11). Only the thread knows whether the turn appeared
   * after it mounted, so it decides; only the user's bubble uses it so far.
   */
  shouldReveal?: boolean;
};

export function TurnBubble({
  turn,
  spokenWordCount,
  conversationLang,
  shouldReveal = false,
}: TurnBubbleProps) {
  const turnIsBeingSpoken = spokenWordCount !== null;
  const textClassName = shouldReveal ? revealStyles.text : undefined;

  return (
    <Bubble
      author={turn.author}
      className={
        shouldReveal
          ? [
              revealStyles.reveal,
              // The anchor is the user's side; an AI turn keeps the default top-left.
              turn.author === "user" ? revealStyles.fromBottomRight : undefined,
            ]
              .filter(Boolean)
              .join(" ")
          : undefined
      }
    >
      <span
        className={[styles.speakerLabel, textClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {turn.author === "ai" ? "AI: " : "You: "}
      </span>
      <p lang={conversationLang} className={textClassName}>
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
          contentClassName={shouldReveal ? revealStyles.afterText : undefined}
        />
      )}
    </Bubble>
  );
}
