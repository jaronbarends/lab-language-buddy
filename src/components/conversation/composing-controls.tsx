"use client";

import { Button } from "@/components/ui/button";
import { CrossIcon, PencilIcon, SendIcon } from "@/components/ui/icons";
import { unlockAudio } from "@/hooks/use-audio-playback";
import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import { composedTextOf, type ComposingTurnState } from "@/lib/session-reducer";

import { DraftBubble, DraftEditor } from "./draft-review";
import { LiveTranscript } from "./live-transcript";
import styles from "./conversation-controls.module.css";

type ComposingControlsProps = {
  turnState: ComposingTurnState;
  conversationLang: string;
};

/**
 * Listening, reviewing and editing are one continuous act of composing a turn, so
 * they share a single set of controls rather than swapping the bar out underneath
 * the user. Only the text above them changes: live transcript, settled draft, or
 * an editable field.
 *
 * There is no Stop: Send, Edit and Cancel each end recording on their way to
 * somewhere useful, which leaves Stop with nothing of its own to do. End session
 * is absent here too — a turn in progress has to be sent or cancelled first.
 */
export function ComposingControls({
  turnState,
  conversationLang,
}: ComposingControlsProps) {
  const dispatch = useSessionDispatch();

  const editIsInProgress = turnState.name === "editing";
  const text = composedTextOf(turnState);

  // Send is offered from all three composing states, so the text comes from
  // whichever one is active: still-arriving transcript, settled draft, or the
  // field being edited.
  function handleSend() {
    if (!text.trim()) {
      return;
    }

    // Sending is the gesture that precedes the AI's spoken reply, which plays several
    // awaited fetches later.
    unlockAudio();

    dispatch({
      type: "USER_TURN_SENT",
      id: crypto.randomUUID(),
      text: text.trim(),
    });
  }

  function handleCancel() {
    dispatch({
      type: editIsInProgress ? "DRAFT_EDIT_CANCELLED" : "DRAFT_DISCARDED",
    });
  }

  return (
    <div className={styles.controls}>
      {turnState.name === "listening" && (
        <LiveTranscript
          transcript={turnState.transcript}
          conversationLang={conversationLang}
        />
      )}
      {turnState.name === "reviewing" && (
        <DraftBubble
          draft={turnState.draft}
          conversationLang={conversationLang}
        />
      )}
      {turnState.name === "editing" && (
        <DraftEditor
          draft={turnState.draft}
          conversationLang={conversationLang}
          onChange={(draft) => dispatch({ type: "DRAFT_CHANGED", draft })}
        />
      )}

      <Button icon={<SendIcon />} onClick={handleSend} disabled={!text.trim()}>
        Send
      </Button>

      <div className={styles.sideBySide}>
        <Button
          variant="secondary"
          icon={<PencilIcon />}
          onClick={() => dispatch({ type: "DRAFT_EDIT_STARTED" })}
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
          onClick={handleCancel}
        >
          {editIsInProgress ? "Cancel edit" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
