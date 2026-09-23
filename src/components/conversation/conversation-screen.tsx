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

  function handleStopListening() {
    const draft =
      turnState.name === "listening" ? joinTranscript(turnState.transcript) : "";
    dispatch({ type: "LISTENING_STOPPED", draft });
  }

  function handleDraftSend() {
    if (turnState.name !== "reviewing") {
      return;
    }
    dispatch({
      type: "USER_TURN_SENT",
      turn: {
        id: crypto.randomUUID(),
        author: "user",
        text: turnState.draft.trim(),
      },
    });
  }

  return (
    <div className={styles.screen}>
      <ConversationThread turns={turns} turnState={turnState} />

      <div className={styles.controlBar}>
        <ConversationControls
          turnState={turnState}
          onReply={handleReply}
          onStopListening={handleStopListening}
          onDraftEdit={() => dispatch({ type: "DRAFT_EDIT_STARTED" })}
          onDraftChange={(draft) => dispatch({ type: "DRAFT_CHANGED", draft })}
          onDraftSend={handleDraftSend}
          onDraftCancel={() => dispatch({ type: "DRAFT_DISCARDED" })}
          onDismissError={() => dispatch({ type: "ERROR_DISMISSED" })}
          onEndSession={() => dispatch({ type: "SESSION_ENDED" })}
        />
      </div>
    </div>
  );
}
