"use client";

import type { Turn, TurnState } from "@/lib/session-reducer";

import { ConversationControls } from "./conversation-controls";
import { ConversationThread } from "./conversation-thread";
import styles from "./conversation-screen.module.css";

type ConversationScreenProps = {
  turns: Turn[];
  turnState: TurnState;
  /** BCP 47 tag of the practice language, for the `lang` attribute on conversation text. */
  conversationLang: string;
};

export function ConversationScreen({
  turns,
  turnState,
  conversationLang,
}: ConversationScreenProps) {
  return (
    <main className={styles.screen}>
      <ConversationThread
        turns={turns}
        turnState={turnState}
        conversationLang={conversationLang}
      />

      <div className={styles.controlBar}>
        <ConversationControls
          turnState={turnState}
          conversationLang={conversationLang}
          conversationIsEmpty={turns.length === 0}
        />
      </div>
    </main>
  );
}
