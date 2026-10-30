import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { Turn } from "@/lib/session-reducer";

import revealStyles from "./bubble-reveal.module.css";
import { Bubble } from "./bubble";
import { HighlightedText } from "./highlighted-text";
import { ThinkingIndicator } from "./thinking-indicator";
import turnStyles from "./turn-bubble.module.css";

type AiTurn = Extract<Turn, { author: "ai" }>;

type GrowFrom = { x: number; y: number } | "from-nothing";

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
  const turnIsWaiting = turn === null;

  const bubbleRef = useRef<HTMLDivElement>(null);
  // What the waiting bubble looked like: its size, and how long its entry was delayed
  // and when it was mounted (to tell whether it had become visible yet).
  const waitingRef = useRef<{
    width: number;
    height: number;
    entryDelayMs: number;
    mountedAt: number;
  } | null>(null);
  // Null until the reply's reveal is decided. Then either the scale to start from, or
  // "from-nothing" (uniform scale from 0, as before).
  const [growFrom, setGrowFrom] = useState<GrowFrom | null>(null);

  // Spike (JNL-003, K14, clarification of decision 2). Order, on purpose: the reply first
  // renders WITHOUT the reveal class; this layout effect measures it (the read forces a
  // layout, so nothing animates yet) and sets the state; the re-render then adds the
  // class and the two custom properties in the same commit, so the animation can never
  // start without them. Layout effects and the state update they cause run before paint.
  useLayoutEffect(() => {
    const element = bubbleRef.current;
    if (!element) {
      return;
    }

    if (turnIsWaiting) {
      // offsetWidth/offsetHeight ignore transforms, so the entry's scale does not
      // distort them; the size of the dots bubble is constant, one measurement is enough.
      const entryAnimation = element.getAnimations()[0];
      waitingRef.current = {
        width: element.offsetWidth,
        height: element.offsetHeight,
        entryDelayMs: Number(entryAnimation?.effect?.getComputedTiming().delay ?? 0),
        mountedAt: performance.now(),
      };
      return;
    }

    if (!startedAsThinking || growFrom !== null) {
      return;
    }

    const waiting = waitingRef.current;
    const newWidth = element.offsetWidth;
    const newHeight = element.offsetHeight;
    // Inside the entry delay the dots bubble is still at scale 0 and was never seen:
    // growing from its size would show a small bubble out of nowhere. Approximated with
    // the time since mount (the exact start of the animation is not observable here,
    // because this commit already removed it).
    const dotsWereSeen =
      waiting !== null && performance.now() - waiting.mountedAt >= waiting.entryDelayMs;
    const x = waiting ? waiting.width / newWidth : NaN;
    const y = waiting ? waiting.height / newHeight : NaN;
    const ratiosAreUsable =
      dotsWereSeen && Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0;

    setGrowFrom(ratiosAreUsable ? { x, y } : "from-nothing");
  }, [turnIsWaiting, startedAsThinking, growFrom]);

  if (turn === null) {
    // Role and label as the old ThinkingBubble had them (JNL-003, K6 parked).
    return (
      <Bubble
        ref={bubbleRef}
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
  // Only once the layout effect has measured (see above).
  const reveals = startedAsThinking && growFrom !== null;
  const growVariables =
    reveals && growFrom !== "from-nothing"
      ? ({
          "--grow-from-x": growFrom.x,
          "--grow-from-y": growFrom.y,
        } as CSSProperties)
      : undefined;

  return (
    <Bubble
      ref={bubbleRef}
      author="ai"
      className={reveals ? revealStyles.reveal : undefined}
      style={growVariables}
    >
      <span
        className={[
          turnStyles.speakerLabel,
          reveals ? revealStyles.text : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        AI:{" "}
      </span>
      <p
        lang={conversationLang}
        className={reveals ? revealStyles.text : undefined}
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
