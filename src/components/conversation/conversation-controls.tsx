"use client";

import { Button } from "@/components/ui/button";
import { FinishIcon, MicIcon, StopIcon } from "@/components/ui/icons";
import type { TurnState } from "@/lib/session-reducer";

import { DraftReview } from "./draft-review";
import styles from "./conversation-controls.module.css";

type ConversationControlsProps = {
  turnState: TurnState;
  onReply: () => void;
  onStopListening: () => void;
  onDraftEdit: () => void;
  onDraftChange: (draft: string) => void;
  onDraftSend: () => void;
  onDraftCancel: () => void;
  onDismissError: () => void;
  onEndSession: () => void;
};

/**
 * The bottom bar. Exactly one set of actions is offered per turn state — there's no
 * point rendering a disabled Reply next to a draft that's waiting to be sent, and a
 * greyed-out button invites a tap that does nothing.
 */
export function ConversationControls({
  turnState,
  onReply,
  onStopListening,
  onDraftEdit,
  onDraftChange,
  onDraftSend,
  onDraftCancel,
  onDismissError,
  onEndSession,
}: ConversationControlsProps) {
  if (turnState.name === "reviewing") {
    return (
      <div className={styles.controls}>
        <DraftReview
          draft={turnState.draft}
          draftIsEditable={turnState.draftIsEditable}
          onEdit={onDraftEdit}
          onChange={onDraftChange}
          onSend={onDraftSend}
          onCancel={onDraftCancel}
        />
      </div>
    );
  }

  if (turnState.name === "error") {
    return (
      <div className={styles.controls}>
        <div className={styles.error} role="alert">
          <span className={styles.errorTitle}>Something went wrong</span>
          <span className={styles.errorMessage}>{turnState.message}</span>
        </div>
        <div className={styles.sideBySide}>
          <Button variant="secondary" onClick={onDismissError}>
            Try again
          </Button>
          <Button
            variant="secondary"
            icon={<FinishIcon />}
            onClick={onEndSession}
          >
            End session
          </Button>
        </div>
      </div>
    );
  }

  if (turnState.name === "listening") {
    return (
      <div className={styles.controls}>
        <Button icon={<StopIcon />} onClick={onStopListening}>
          Stop
        </Button>
        <Button
          variant="secondary"
          icon={<FinishIcon />}
          onClick={onEndSession}
        >
          End session
        </Button>
      </div>
    );
  }

  // awaitingUser / aiThinking / aiSpeaking. Reply stays visible while the AI has the
  // floor so the bar doesn't reflow mid-conversation, but it's disabled: talking over
  // the AI is the continuous-mic model, which is explicitly out of scope here.
  //
  // Deliberate difference from resources/screenshots-reference/, where Reply is grey
  // in every state: here it's a primary button, so it goes magenta once it's actually
  // tappable and grey while the AI is talking. Confirmed as intended — not a drift
  // from the reference to be tidied up later.
  const replyIsAvailable = turnState.name === "awaitingUser";

  return (
    <div className={styles.controls}>
      <Button
        variant="primary"
        icon={<MicIcon />}
        onClick={onReply}
        disabled={!replyIsAvailable}
      >
        Reply
      </Button>
      <Button variant="secondary" icon={<FinishIcon />} onClick={onEndSession}>
        End session
      </Button>
    </div>
  );
}
