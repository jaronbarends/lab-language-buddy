import { useState } from "react";

import type { Turn } from "@/lib/session-reducer";

import revealStyles from "./bubble-reveal.module.css";
import { Bubble } from "./bubble";
import { HighlightedText } from "./highlighted-text";
import { ThinkingIndicator } from "./thinking-indicator";
import turnStyles from "./turn-bubble.module.css";

type AiTurn = Extract<Turn, { author: "ai" }>;

type AiBubbleProps = {
  /** Null while the AI is still thinking: the bubble then shows the dots. */
  turn: AiTurn | null;
  /** Non-null only while this turn is being read aloud. */
  spokenWordCount: number | null;
  conversationLang: string;
  /**
   * Only read while waiting. True when the waiting bubble follows a sent user turn: its
   * entry then starts after the thinking delay. False for the AI's opening turn, which
   * enters at once (JNL-003, K14).
   */
  followsSentTurn?: boolean;
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
  followsSentTurn = false,
}: AiBubbleProps) {
  // Whether this element started life as the dots. Only then is there something to
  // reveal from; an AI turn that mounts with its text (no thinking state before it)
  // just appears. Lazy initial state is never updated, so it records the first render.
  const [startedAsThinking] = useState(turn === null);

  if (turn === null) {
    // Role and label as the old ThinkingBubble had them (JNL-003, K6 parked).
    return (
      <Bubble
        author="ai"
        role="status"
        aria-label="Waiting for a reply"
        className={[
          revealStyles.waiting,
          followsSentTurn ? revealStyles.waitingAfterSentTurn : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ThinkingIndicator className={revealStyles.waitingDots} />
      </Bubble>
    );
  }

  const turnIsBeingSpoken = spokenWordCount !== null;

  return (
    <Bubble
      author="ai"
      className={startedAsThinking ? revealStyles.reveal : undefined}
    >
      <span
        className={[
          turnStyles.speakerLabel,
          startedAsThinking ? revealStyles.text : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        AI:{" "}
      </span>
      <p
        lang={conversationLang}
        className={startedAsThinking ? revealStyles.text : undefined}
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
