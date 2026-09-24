"use client";

import { Button } from "@/components/ui/button";
import {
  CrossIcon,
  FinishIcon,
  MicIcon,
  PencilIcon,
  SendIcon,
} from "@/components/ui/icons";
import { joinTranscript, type TurnState } from "@/lib/session-reducer";

import { DraftBubble, DraftEditor } from "./draft-review";
import { LiveTranscript } from "./live-transcript";
import styles from "./conversation-controls.module.css";

type ConversationControlsProps = {
  turnState: TurnState;
  /** No turns yet, so there is nothing to reply to — see the Reply label below. */
  conversationIsEmpty: boolean;
  onReply: () => void;
  onDraftEdit: () => void;
  onDraftChange: (draft: string) => void;
  onDraftSend: () => void;
  onDraftCancel: () => void;
  onEditCancel: () => void;
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
  conversationIsEmpty,
  onReply,
  onDraftEdit,
  onDraftChange,
  onDraftSend,
  onDraftCancel,
  onEditCancel,
  onDismissError,
  onEndSession,
}: ConversationControlsProps) {
  // Listening, reviewing and editing are one continuous act of composing a turn, so
  // they share a single set of controls rather than swapping the bar out underneath
  // the user. Only the text above them changes: live transcript, settled draft, or
  // an editable field.
  //
  // There is no Stop: Send, Edit and Cancel each end recording on their way to
  // somewhere useful, which leaves Stop with nothing of its own to do. End session
  // is absent here too — a turn in progress has to be sent or cancelled first.
  const composing =
    turnState.name === "listening" ||
    turnState.name === "reviewing" ||
    turnState.name === "editing"
      ? turnState
      : null;

  if (composing) {
    const editIsInProgress = composing.name === "editing";
    const text =
      composing.name === "listening"
        ? joinTranscript(composing.transcript)
        : composing.draft;

    return (
      <div className={styles.controls}>
        {composing.name === "listening" && (
          <LiveTranscript transcript={composing.transcript} />
        )}
        {composing.name === "reviewing" && (
          <DraftBubble draft={composing.draft} />
        )}
        {composing.name === "editing" && (
          <DraftEditor draft={composing.draft} onChange={onDraftChange} />
        )}

        <Button
          icon={<SendIcon />}
          onClick={onDraftSend}
          disabled={!text.trim()}
        >
          Send
        </Button>

        <div className={styles.sideBySide}>
          <Button
            variant="secondary"
            icon={<PencilIcon />}
            onClick={onDraftEdit}
            disabled={editIsInProgress}
          >
            Edit
          </Button>
          {/* Cancel means two different things depending on where you are: back out
              of the edit, or back out of the whole turn. Labelled so the difference
              is visible before tapping rather than after. */}
          <Button
            variant="secondary"
            icon={<CrossIcon />}
            onClick={editIsInProgress ? onEditCancel : onDraftCancel}
          >
            {editIsInProgress ? "Cancel edit" : "Cancel"}
          </Button>
        </div>
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

  // awaitingUser / aiThinking / aiSpeaking. Reply stays visible while the AI has the
  // floor so the bar doesn't reflow mid-conversation, but it's disabled: talking over
  // the AI is the continuous-mic model, which is explicitly out of scope here.
  //
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
        onClick={onReply}
        disabled={!replyIsAvailable}
      >
        {replyWouldOpenTheConversation ? "Start conversation" : "Reply"}
      </Button>
      <Button variant="secondary" icon={<FinishIcon />} onClick={onEndSession}>
        End session
      </Button>
    </div>
  );
}
