import { useState } from "react";

import type { Turn } from "@/lib/session-reducer";

import styles from "./ai-bubble.module.css";
import { Bubble } from "./bubble";
import { HighlightedText } from "./highlighted-text";
import { ThinkingBubble } from "./thinking-bubble";
import turnStyles from "./turn-bubble.module.css";

type AiTurn = Extract<Turn, { author: "ai" }>;

type AiBubbleProps = {
  /** Null while the AI is still thinking: the bubble then shows the dots. */
  turn: AiTurn | null;
  /** Non-null only while this turn is being read aloud. */
  spokenWordCount: number | null;
  conversationLang: string;
};

/**
 * The AI's bubble, for both the waiting state and the reply. The thread gives it the
 * same key in both (`ai-<position>`), so React keeps this one element and the text
 * replaces the dots in place, and the bubble grows out of its top-left corner
 * (JNL-003, K2 and K4(A)).
 *
 * The layout takes the final size at once; only a scale (a transform, which does not
 * affect layout) is animated, so the thread's scroll effect sees the final size and
 * needs no change. The text fades in after the growth has finished.
 *
 * Spike: expect this to be adjusted after the iPhone test.
 */
export function AiBubble({
  turn,
  spokenWordCount,
  conversationLang,
}: AiBubbleProps) {
  // Whether this element started life as the dots. Only then is there something to
  // reveal from; an AI turn that mounts with its text (no thinking state before it)
  // just appears. Lazy initial state is never updated, so it records the first render.
  const [startedAsThinking] = useState(turn === null);

  if (turn === null) {
    // Role and label as ThinkingBubble had them (JNL-003, K6 parked).
    return (
      <Bubble author="ai" role="status" aria-label="Waiting for a reply">
        <ThinkingBubble />
      </Bubble>
    );
  }

  const turnIsBeingSpoken = spokenWordCount !== null;

  return (
    <Bubble
      author="ai"
      className={startedAsThinking ? styles.reveal : undefined}
    >
      <span
        className={[
          turnStyles.speakerLabel,
          startedAsThinking ? styles.text : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        AI:{" "}
      </span>
      <p
        lang={conversationLang}
        className={startedAsThinking ? styles.text : undefined}
      >
        {turnIsBeingSpoken ? (
          <HighlightedText text={turn.text} spokenWordCount={spokenWordCount} />
        ) : (
          turn.text
        )}
      </p>
    </Bubble>
  );
}
