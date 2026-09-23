"use client";

import { useEffect, useRef } from "react";

import type { Turn, TurnState } from "@/lib/session-reducer";

import { LiveTranscript } from "./live-transcript";
import { ThinkingBubble } from "./thinking-bubble";
import { TurnBubble } from "./turn-bubble";
import styles from "./conversation-thread.module.css";

type ConversationThreadProps = {
  turns: Turn[];
  turnState: TurnState;
};

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
    thread.scrollTop = thread.scrollHeight;
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

      {turnState.name === "listening" && (
        <LiveTranscript transcript={turnState.transcript} />
      )}
    </div>
  );
}
