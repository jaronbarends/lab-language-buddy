"use client";

import { Button } from "@/components/ui/button";
import { FinishIcon, WarningIcon } from "@/components/ui/icons";
import { unlockAudio } from "@/hooks/use-audio-playback";
import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import type { ErrorTurnState } from "@/lib/session-reducer";

import styles from "./conversation-controls.module.css";
import errorStyles from "./error-controls.module.css";

type ErrorControlsProps = {
  turnState: ErrorTurnState;
};

export function ErrorControls({ turnState }: ErrorControlsProps) {
  const dispatch = useSessionDispatch();

  function handleTryAgain() {
    // Trying again after a failed AI call ends in the AI speaking, and this click is the
    // gesture that has to unlock the audio, as in Start chat, Send and Reply.
    unlockAudio();
    dispatch({ type: "ERROR_DISMISSED" });
  }

  return (
    <div className={styles.controls}>
      <div className={errorStyles.error} role="alert">
        <WarningIcon size={24} />
        <div className={errorStyles.errorText}>
          <span className={errorStyles.errorTitle}>Something went wrong</span>
          <span className={errorStyles.errorMessage}>{turnState.message}</span>
          {turnState.detail && (
            <span className={errorStyles.errorMessage}>{turnState.detail}</span>
          )}
        </div>
      </div>
      <div className={styles.sideBySide}>
        <Button variant="secondary" onClick={handleTryAgain}>
          Try again
        </Button>
        <Button
          variant="secondary"
          icon={<FinishIcon />}
          onClick={() => dispatch({ type: "SESSION_ENDED" })}
        >
          End session
        </Button>
      </div>
    </div>
  );
}
