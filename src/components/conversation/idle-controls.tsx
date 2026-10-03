"use client";

import { Button } from "@/components/ui/button";
import { FinishIcon, MicIcon } from "@/components/ui/icons";
import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import type { IdleTurnState } from "@/lib/session-reducer";

import styles from "./conversation-controls.module.css";

type IdleControlsProps = {
  turnState: IdleTurnState;
  /** No turns yet, so there is nothing to reply to — see the Reply label below. */
  conversationIsEmpty: boolean;
};

/**
 * awaitingUser / aiThinking / aiSpeaking. Reply stays visible while the AI has the
 * floor so the bar doesn't reflow mid-conversation, but it's disabled: talking over
 * the AI is the continuous-mic model, which is explicitly out of scope here.
 */
export function IdleControls({
  turnState,
  conversationIsEmpty,
}: IdleControlsProps) {
  const dispatch = useSessionDispatch();

  function handleReply() {
    // Stage 3: the audio unlock goes here too — this click is the gesture that
    // precedes the AI's next spoken reply.
    dispatch({ type: "LISTENING_STARTED" });
  }

  // Deliberate difference from resources/screenshots-reference/, where Reply is grey
  // in every state: here it's a primary button, so it goes magenta once it's actually
  // tappable and grey while the AI is talking. Confirmed as intended — not a drift
  // from the reference to be tidied up later.
  const replyIsAvailable = turnState.name === "awaitingUser";

  // "Reply" is wrong before anyone has said anything, which is the case when the
  // user was the one picked to open the conversation. Gated on the button actually
  // being available too: with the AI opening, the turn list is briefly empty while
  // it thinks, and the disabled button should not be inviting the user to start.
  const replyWouldOpenTheConversation = conversationIsEmpty && replyIsAvailable;

  return (
    <div className={styles.controls}>
      <Button
        variant="primary"
        icon={<MicIcon />}
        onClick={handleReply}
        disabled={!replyIsAvailable}
      >
        {replyWouldOpenTheConversation ? "Start conversation" : "Reply"}
      </Button>
      <Button
        variant="secondary"
        icon={<FinishIcon />}
        onClick={() => dispatch({ type: "SESSION_ENDED" })}
      >
        End session
      </Button>
    </div>
  );
}
