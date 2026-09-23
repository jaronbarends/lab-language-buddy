"use client";

import { useState } from "react";

import { useSessionDispatch } from "@/hooks/use-session";
import { mockTranscriptAt, mockUserLine } from "@/lib/mock-conversation";
import type {
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

  const options: { name: TurnStateName; state: TurnState | null }[] = [
    { name: "awaitingUser", state: { name: "awaitingUser" } },
    {
      name: "listening",
      state: {
        name: "listening",
        transcript: mockTranscriptAt(sampleUserLine, 6),
      },
    },
    {
      name: "reviewing",
      state: {
        name: "reviewing",
        draft: sampleUserLine,
        draftIsEditable: false,
      },
    },
    { name: "aiThinking", state: { name: "aiThinking" } },
    {
      name: "aiSpeaking",
      // Needs a real turn to highlight; unavailable until the AI has said something.
      state: lastAiTurn
        ? { name: "aiSpeaking", turnId: lastAiTurn.id, spokenWordCount: 4 }
        : null,
    },
    {
      name: "error",
      state: {
        name: "error",
        message: "Could not reach the transcription service.",
      },
    },
  ];

  return (
    <div className={styles.wrapper}>
      {panelIsOpen && (
        <div className={styles.panel}>
          <span className={styles.heading}>Force turn state</span>
          {options.map((option) => (
            <button
              key={option.name}
              type="button"
              disabled={!option.state}
              className={`${styles.option} ${
                turnState.name === option.name ? styles.active : ""
              }`}
              onClick={() => {
                if (!option.state) {
                  return;
                }
                dispatch({
                  type: "DEV_FORCED_TURN_STATE",
                  turnState: option.state,
                });
              }}
            >
              {option.name}
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
