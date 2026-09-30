"use client";

import { Button } from "@/components/ui/button";
import { FinishIcon, WarningIcon } from "@/components/ui/icons";
import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import type { ErrorTurnState } from "@/lib/session-reducer";

import styles from "./conversation-controls.module.css";
import errorStyles from "./error-controls.module.css";

type ErrorControlsProps = {
  turnState: ErrorTurnState;
};

export function ErrorControls({ turnState }: ErrorControlsProps) {
  const dispatch = useSessionDispatch();

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
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "ERROR_DISMISSED" })}
        >
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
