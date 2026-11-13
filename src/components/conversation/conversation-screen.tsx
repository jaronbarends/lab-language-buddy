"use client";

import type { Starter, Turn, TurnState } from "@/lib/session-reducer";

import { ConversationControls } from "./conversation-controls";
import { ConversationThread } from "./conversation-thread";
import styles from "./conversation-screen.module.css";

type ConversationScreenProps = {
  turns: Turn[];
  turnState: TurnState;
  /** BCP 47 tag of the practice language, for the `lang` attribute on conversation text. */
  conversationLang: string;
  /** Only this field of the config, for the thread's opening hint (PDR-020, PDR-010). */
  starter: Starter;
};

export function ConversationScreen({
  turns,
  turnState,
  conversationLang,
  starter,
}: ConversationScreenProps) {
  return (
    <main className={styles.screen}>
      <ConversationThread
        turns={turns}
        turnState={turnState}
        conversationLang={conversationLang}
        starter={starter}
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
