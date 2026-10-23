"use client";

import { useLayoutEffect, useRef } from "react";

import type { Turn, TurnState } from "@/lib/session-reducer";

import { AiBubble } from "./ai-bubble";
import { TurnBubble } from "./turn-bubble";
import styles from "./conversation-thread.module.css";

type ConversationThreadProps = {
  turns: Turn[];
  turnState: TurnState;
  conversationLang: string;
};

/**
 * Breathing room left above a top-aligned bubble, so it doesn't sit flush against
 * the edge. Matches the thread's own top padding (--space-4).
 */
const NEWEST_ITEM_TOP_GAP = 16;

/** How many AI turns come before `endIndex`: the position an AI bubble is keyed by. */
function countAiTurns(turns: Turn[], endIndex: number) {
  return turns.slice(0, endIndex).filter((turn) => turn.author === "ai").length;
}

function aiBubbleKey(position: number) {
  return `ai-${position}`;
}

export function ConversationThread({
  turns,
  turnState,
  conversationLang,
}: ConversationThreadProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);

  // The evaluation sits in the user's bubble, which grows when it settles. That can push
  // the newest item out of view without a new turn or another turn state.
  const lastUserTurn = turns.findLast((turn) => turn.author === "user");
  const lastUserEvaluationStatus =
    lastUserTurn?.author === "user" ? lastUserTurn.evaluation.status : null;

  const speakingTurnId =
    turnState.name === "aiSpeaking" ? turnState.turnId : null;
  const spokenWordCount =
    turnState.name === "aiSpeaking" ? turnState.spokenWordCount : 0;

  // Keep the newest content in view. Keyed on the turn count, the state name and the
  // last user turn's evaluation status rather than on the whole state, so the highlight
  // ticking forward several times a second doesn't trigger a scroll on every word.
  //
  // Before paint, so a turn that arrives from a timer or the network is never painted
  // once at the old scroll position and then jumped.
  useLayoutEffect(() => {
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
  }, [turns.length, turnState.name, lastUserEvaluationStatus]);

  // One array for the turns and the waiting bubble: React matches keys only among the
  // children of the same array, so the waiting AiBubble and the reply that replaces it
  // are the same element only if both sit in this array (JNL-002, K2).
  const items = turns.map((turn, index) => {
    const turnSpokenWordCount =
      turn.id === speakingTurnId ? spokenWordCount : null;

    if (turn.author === "user") {
      return (
        <TurnBubble
          key={turn.id}
          turn={turn}
          conversationLang={conversationLang}
          spokenWordCount={turnSpokenWordCount}
        />
      );
    }

    // Keyed by position, not by turn id. Turns are only ever appended or reset, so the
    // position cannot shift mid-session.
    return (
      <AiBubble
        key={aiBubbleKey(countAiTurns(turns, index))}
        turn={turn}
        conversationLang={conversationLang}
        spokenWordCount={turnSpokenWordCount}
      />
    );
  });

  if (turnState.name === "aiThinking") {
    items.push(
      <AiBubble
        key={aiBubbleKey(countAiTurns(turns, turns.length))}
        turn={null}
        conversationLang={conversationLang}
        spokenWordCount={null}
      />,
    );
  }

  return (
    // role="log" is an implicit polite live region, so appended replies are
    // announced while focus stays on the controls.
    <div
      className={styles.thread}
      ref={threadRef}
      role="log"
      aria-label="Conversation"
    >
      {items}
    </div>
  );
}
