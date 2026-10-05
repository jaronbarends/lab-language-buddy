"use client";

import { useState } from "react";

import { useSessionDispatch } from "@/hooks/use-session-dispatch";
import { mockTranscriptAt, mockUserLine } from "@/lib/mock-conversation";
import type {
  SessionAction,
  SessionConfig,
  Turn,
  TurnState,
  TurnStateName,
} from "@/lib/session-reducer";

import styles from "./state-stepper.module.css";

type StateStepperProps = {
  config: SessionConfig;
  turns: Turn[];
  turnState: TurnState;
};

type StepperOption = {
  key: string;
  label: string;
  /** Null disables the button. */
  action: SessionAction | null;
  isActive: boolean;
};

function forcedTurnState(turnState: TurnState): SessionAction {
  return { type: "DEV_FORCED_TURN_STATE", turnState };
}

/**
 * Development-only. Jumps straight to any turn state so layouts can be checked on a
 * real phone without having to talk the app into each one — the error state in
 * particular is otherwise awkward to reach.
 *
 * Gated on NODE_ENV, which is statically replaced at build time, so this component
 * and its dispatch path are dropped from a production bundle entirely.
 */
export function StateStepper({ config, turns, turnState }: StateStepperProps) {
  const dispatch = useSessionDispatch();
  const [panelIsOpen, setPanelIsOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const lastAiTurn = [...turns].reverse().find((turn) => turn.author === "ai");
  const sampleUserLine = mockUserLine(config.language, 0);

  function turnStateNameIs(name: TurnStateName) {
    return turnState.name === name;
  }

  const microphoneIsLive =
    turnState.name === "listening" && turnState.microphoneIsLive;

  const options: StepperOption[] = [
    {
      key: "awaitingUser",
      label: "awaitingUser",
      action: forcedTurnState({ name: "awaitingUser" }),
      isActive: turnStateNameIs("awaitingUser"),
    },
    {
      key: "listening",
      label: "listening",
      action: forcedTurnState({
        name: "listening",
        transcript: mockTranscriptAt(sampleUserLine, 6),
        microphoneIsLive: true,
      }),
      isActive: microphoneIsLive,
    },
    {
      key: "listening-not-live",
      label: "listening (mic not live)",
      action: forcedTurnState({
        name: "listening",
        transcript: { finalized: "", interim: "" },
        microphoneIsLive: false,
      }),
      isActive: turnStateNameIs("listening") && !microphoneIsLive,
    },
    {
      key: "reviewing",
      label: "reviewing",
      action: forcedTurnState({ name: "reviewing", draft: sampleUserLine }),
      isActive: turnStateNameIs("reviewing"),
    },
    {
      key: "editing",
      label: "editing",
      action: forcedTurnState({
        name: "editing",
        draft: sampleUserLine,
        draftBeforeEdit: sampleUserLine,
      }),
      isActive: turnStateNameIs("editing"),
    },
    {
      key: "aiThinking",
      label: "aiThinking",
      action: forcedTurnState({ name: "aiThinking" }),
      isActive: turnStateNameIs("aiThinking"),
    },
    {
      key: "aiSpeaking",
      label: "aiSpeaking",
      // Needs a real turn to highlight; unavailable until the AI has said something.
      action: lastAiTurn
        ? forcedTurnState({
            name: "aiSpeaking",
            turnId: lastAiTurn.id,
            spokenWordCount: 4,
          })
        : null,
      isActive: turnStateNameIs("aiSpeaking"),
    },
    {
      // Not a state but an action: only meaningful while the AI is speaking.
      key: "speechFails",
      label: "speech fails",
      action:
        turnState.name === "aiSpeaking"
          ? { type: "AI_SPEECH_FAILED", turnId: turnState.turnId }
          : null,
      isActive: false,
    },
    {
      key: "error",
      label: "error",
      action: forcedTurnState({
        name: "error",
        message: "Could not reach the transcription service.",
        detail: "WebSocket closed with code 1006",
        from: "listening",
      }),
      isActive: turnStateNameIs("error"),
    },
  ];

  return (
    <div className={styles.wrapper}>
      {panelIsOpen && (
        <div className={styles.panel}>
          <span className={styles.heading}>Force turn state</span>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={!option.action}
              className={`${styles.option} ${
                option.isActive ? styles.active : ""
              }`}
              onClick={() => {
                if (!option.action) {
                  return;
                }
                dispatch(option.action);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setPanelIsOpen((isOpen) => !isOpen)}
      >
        {panelIsOpen ? "Close" : "Dev"}
      </button>
    </div>
  );
}
