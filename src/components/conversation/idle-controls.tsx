"use client";

import { Button } from "@/components/ui/button";
import { FinishIcon, MicIcon } from "@/components/ui/icons";
import { unlockAudio } from "@/hooks/use-audio-playback";
import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import type { IdleTurnState } from "@/lib/session-reducer";

import styles from "./conversation-controls.module.css";

type IdleControlsProps = {
  turnState: IdleTurnState;
  /** No turns yet, so there is nothing to reply to — see the Reply label below. */
  conversationIsEmpty: boolean;
};

/**
 * awaitingUser / aiThinking / aiSpeaking. Reply is disabled only while the AI is
 * thinking. While it speaks, Reply is enabled and cuts the speech off (see
 * `LISTENING_STARTED` in the reducer): an explicit tap, not the continuous-mic model,
 * which stays out of scope.
 */
export function IdleControls({
  turnState,
  conversationIsEmpty,
}: IdleControlsProps) {
  const dispatch = useSessionDispatch();

  function handleReply() {
    // This click is a gesture that can precede the AI's next spoken reply.
    unlockAudio();
    dispatch({ type: "LISTENING_STARTED" });
  }

  // Deliberate difference from resources/screenshots-reference/, where Reply is grey
  // in every state: here it's a primary button, so it goes magenta once it's actually
  // tappable and grey while the AI is thinking. Confirmed as intended — not a drift
  // from the reference to be tidied up later.
  const replyIsAvailable =
    turnState.name === "awaitingUser" || turnState.name === "aiSpeaking";

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
