"use client";

import {
  joinTranscript,
  type Turn,
  type TurnState,
} from "@/lib/session-reducer";
import { useSessionDispatch } from "@/hooks/use-session";

import { ConversationControls } from "./conversation-controls";
import { ConversationThread } from "./conversation-thread";
import styles from "./conversation-screen.module.css";

type ConversationScreenProps = {
  turns: Turn[];
  turnState: TurnState;
};

export function ConversationScreen({
  turns,
  turnState,
}: ConversationScreenProps) {
  const dispatch = useSessionDispatch();

  function handleReply() {
    // Stage 3: the audio unlock goes here too — this click is the gesture that
    // precedes the AI's next spoken reply.
    dispatch({ type: "LISTENING_STARTED" });
  }

  // Send is offered from all three composing states, so the text comes from
  // whichever one is active: still-arriving transcript, settled draft, or the
  // field being edited.
  function handleDraftSend() {
    const text =
      turnState.name === "listening"
        ? joinTranscript(turnState.transcript)
        : turnState.name === "reviewing" || turnState.name === "editing"
          ? turnState.draft
          : "";

    if (!text.trim()) {
      return;
    }

    dispatch({
      type: "USER_TURN_SENT",
      turn: { id: crypto.randomUUID(), author: "user", text: text.trim() },
    });
  }

  return (
    <div className={styles.screen}>
      <ConversationThread turns={turns} turnState={turnState} />

      <div className={styles.controlBar}>
        <ConversationControls
          turnState={turnState}
          conversationIsEmpty={turns.length === 0}
          onReply={handleReply}
          onDraftEdit={() => dispatch({ type: "DRAFT_EDIT_STARTED" })}
          onDraftChange={(draft) => dispatch({ type: "DRAFT_CHANGED", draft })}
          onDraftSend={handleDraftSend}
          onDraftCancel={() => dispatch({ type: "DRAFT_DISCARDED" })}
          onEditCancel={() => dispatch({ type: "DRAFT_EDIT_CANCELLED" })}
          onDismissError={() => dispatch({ type: "ERROR_DISMISSED" })}
          onEndSession={() => dispatch({ type: "SESSION_ENDED" })}
        />
      </div>
    </div>
  );
}
