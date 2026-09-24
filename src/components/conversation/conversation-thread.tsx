"use client";

import { useEffect, useRef } from "react";

import type { Turn, TurnState } from "@/lib/session-reducer";

import { ThinkingBubble } from "./thinking-bubble";
import { TurnBubble } from "./turn-bubble";
import styles from "./conversation-thread.module.css";

type ConversationThreadProps = {
  turns: Turn[];
  turnState: TurnState;
};

/**
 * Breathing room left above a top-aligned bubble, so it doesn't sit flush against
 * the edge. Matches the thread's own top padding (--space-4).
 */
const NEWEST_ITEM_TOP_GAP = 16;

export function ConversationThread({
  turns,
  turnState,
}: ConversationThreadProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);

  const speakingTurnId =
    turnState.name === "aiSpeaking" ? turnState.turnId : null;
  const spokenWordCount =
    turnState.name === "aiSpeaking" ? turnState.spokenWordCount : 0;

  // Keep the newest content in view. Keyed on the turn count and the state name
  // rather than on the whole state, so the highlight ticking forward several times
  // a second doesn't trigger a scroll on every word.
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) {
      return;
    }

    const newestItem = thread.lastElementChild as HTMLElement | null;
    const bottomScrollTop = Math.max(0, thread.scrollHeight - thread.clientHeight);

    if (!newestItem) {
      thread.scrollTop = bottomScrollTop;
      return;
    }

    // Scrolling to the bottom is right for a bubble that fits, but it lands the
    // user on the *last* line of one that doesn't — and the read-along highlight
    // starts at the first word, which would then be off-screen and stay there,
    // since nothing re-scrolls while the AI is speaking. So when the newest bubble
    // is too tall to show whole, align its top instead and read from the start.
    //
    // `offsetTop < bottomScrollTop` is exactly the "its top would be clipped" test:
    // it asks whether the item begins above where a bottom-scroll would put the
    // viewport. Relies on .thread being a positioned ancestor.
    const newestItemWouldBeClipped = newestItem.offsetTop < bottomScrollTop;

    thread.scrollTop = newestItemWouldBeClipped
      ? Math.max(0, newestItem.offsetTop - NEWEST_ITEM_TOP_GAP)
      : bottomScrollTop;
  }, [turns.length, turnState.name]);

  return (
    <div className={styles.thread} ref={threadRef}>
      {turns.map((turn) => (
        <TurnBubble
          key={turn.id}
          turn={turn}
          spokenWordCount={turn.id === speakingTurnId ? spokenWordCount : null}
        />
      ))}

      {turnState.name === "aiThinking" && <ThinkingBubble />}
    </div>
  );
}
