import type { Evaluation, Turn } from "@/lib/session-reducer";

import { Bubble } from "./bubble";
import { HighlightedText } from "./highlighted-text";
import styles from "./turn-bubble.module.css";

type TurnBubbleProps = {
  turn: Turn;
  /** Non-null only for the turn currently being read aloud. */
  spokenWordCount: number | null;
  conversationLang: string;
};

/**
 * TEMPORARY, replaced by the attached section of stage 4, step 3: the evaluation as plain
 * text, only so its states and their timing can be seen in the browser.
 */
function temporaryEvaluationText(evaluation: Evaluation): string {
  switch (evaluation.status) {
    case "pending":
      return "Evaluating…";
    case "failed":
      return "Evaluation failed";
    case "ready":
      return evaluation.correction
        ? evaluation.correction
            .map(({ type, text }) =>
              type === "text" ? text : `[${type}: ${text}]`,
            )
            .join("")
        : "No corrections. Great!";
  }
}

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
      <span lang={conversationLang}>
        {turnIsBeingSpoken ? (
          <HighlightedText text={turn.text} spokenWordCount={spokenWordCount} />
        ) : (
          turn.text
        )}
      </span>
      {turn.author === "user" && (
        <div>{temporaryEvaluationText(turn.evaluation)}</div>
      )}
    </Bubble>
  );
}
