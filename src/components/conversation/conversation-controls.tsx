"use client";

import type { TurnState } from "@/lib/session-reducer";

import { ComposingControls } from "./composing-controls";
import { ErrorControls } from "./error-controls";
import { IdleControls } from "./idle-controls";

type ConversationControlsProps = {
  turnState: TurnState;
  conversationLang: string;
  conversationIsEmpty: boolean;
};

/**
 * The bottom bar. Exactly one set of actions is offered per turn state — there's no
 * point rendering a disabled Reply next to a draft that's waiting to be sent, and a
 * greyed-out button invites a tap that does nothing.
 */
export function ConversationControls({
  turnState,
  conversationLang,
  conversationIsEmpty,
}: ConversationControlsProps) {
  switch (turnState.name) {
    // One set of controls for all three: see ComposingControls for why there is no
    // Stop and no End session here.
    case "listening":
    case "reviewing":
    case "editing":
      return (
        <ComposingControls
          turnState={turnState}
          conversationLang={conversationLang}
        />
      );

    case "error":
      return <ErrorControls turnState={turnState} />;

    case "awaitingUser":
    case "aiThinking":
    case "aiSpeaking":
      return (
        <IdleControls
          turnState={turnState}
          conversationIsEmpty={conversationIsEmpty}
        />
      );

    default:
      turnState satisfies never;
      return null;
  }
}
